import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Configure Multer for local receipt screenshot uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, and PNG images are allowed!'));
  }
});

// Submit Order (Checkout)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { addressId, paymentMethod, items } = req.body;
  
  // items should be an array of:
  // { productId, quantity, customizations: ["Koreshi", "Pikko"], customSizing: { chest: 38 }, isRental: false, rentalDays: 3 }

  if (!addressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required checkout information' });
  }

  try {
    // Verify address exists
    const address = await prisma.address.findUnique({
      where: { id: addressId, userId: req.user!.id }
    });

    if (!address) {
      return res.status(400).json({ error: 'Valid delivery address not found' });
    }

    let calculatedTotal = 0;
    const itemsToCreate = [];

    // Calculate prices and check stock for each item
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { customizationOptions: true }
      });

      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
      }

      // Calculate customization markup
      let itemCustomizationCost = 0;
      if (item.customizations && Array.isArray(item.customizations)) {
        for (const optName of item.customizations) {
          const match = product.customizationOptions.find(o => o.optionName === optName);
          if (match) {
            itemCustomizationCost += match.priceMarkup;
          }
        }
      }

      let itemPrice = 0;
      let rentalDetail = null;

      if (item.isRental) {
        if (!product.isRentable) {
          return res.status(400).json({ error: `Product is not available for rental: ${product.name}` });
        }
        
        const days = item.rentalDays || 3; // Default 3 days rental
        const baseRent = product.rentPerDay || (product.basePrice * 0.1);
        const deposit = product.depositFee || (product.basePrice * 0.3);

        // Rent calculation: (Base Rent * Days) + Security Deposit
        itemPrice = (baseRent * days) + deposit;

        // Save rental timing
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + days);

        rentalDetail = {
          startDate,
          endDate,
          status: 'AWAITING_DISPATCH',
          notes: `Rental for ${days} days. Deposit paid: ${deposit}.`
        };
      } else {
        // Purchase calculation: Base Price + Embroidery customization markup
        itemPrice = product.basePrice + itemCustomizationCost;
      }

      calculatedTotal += itemPrice * item.quantity;

      itemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase: itemPrice,
        customizations: item.customizations ? JSON.stringify(item.customizations) : null,
        customSizing: item.customSizing ? JSON.stringify(item.customSizing) : null,
        isRental: item.isRental || false,
        rentalDetail
      });
    }

    // Generate Order Number
    const orderCount = await prisma.order.count();
    const orderNumber = `BZR-${10001 + orderCount}`;

    // Execute database transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          addressId,
          totalAmount: calculatedTotal,
          paymentMethod,
          paymentStatus: 'PENDING'
        }
      });

      // Create items
      for (const itemInfo of itemsToCreate) {
        const createdItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: itemInfo.productId,
            quantity: itemInfo.quantity,
            priceAtPurchase: itemInfo.priceAtPurchase,
            customizations: itemInfo.customizations,
            customSizing: itemInfo.customSizing
          }
        });

        // If it was a rental, tie the RentalDetail to this order
        if (itemInfo.isRental && itemInfo.rentalDetail) {
          await tx.rentalDetail.create({
            data: {
              orderId: order.id,
              startDate: itemInfo.rentalDetail.startDate,
              endDate: itemInfo.rentalDetail.endDate,
              status: itemInfo.rentalDetail.status,
              notes: itemInfo.rentalDetail.notes
            }
          });
        }

        // Deduct from stock
        await tx.product.update({
          where: { id: itemInfo.productId },
          data: {
            stockQuantity: {
              decrement: itemInfo.quantity
            }
          }
        });
      }

      return order;
    });

    console.log(`\n[ORDER SUBMITTED] Order Number: ${orderNumber}, Total: Rs. ${calculatedTotal}`);
    console.log(`[DELIVERY SECTOR] sector: ${address.sectorName}, street: ${address.streetAddress}\n`);

    res.status(201).json(newOrder);
  } catch (err: any) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: err.message || 'Failed to submit order' });
  }
});

// Get Current User Orders
router.get('/my-orders', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: {
        address: true,
        orderItems: {
          include: {
            product: {
              include: {
                images: true
              }
            }
          }
        },
        rentals: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (err: any) {
    console.error('Fetch my orders error:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// Upload Bank Transfer Receipt Screenshot
router.post('/:orderId/receipt', authenticateToken, upload.single('receipt'), async (req: AuthenticatedRequest, res) => {
  const { orderId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a receipt screenshot image file' });
  }

  try {
    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user!.id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Save local public url path
    const receiptUrl = `/uploads/${req.file.filename}`;
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentReceiptUrl: receiptUrl,
        paymentStatus: 'PENDING' // Awaiting manual admin confirmation
      }
    });

    console.log(`[BANK RECEIPT UPLOADED] Order: ${order.orderNumber}, File path: ${receiptUrl}`);

    res.json({
      message: 'Receipt uploaded successfully. Admin will verify shortly.',
      order: updatedOrder
    });
  } catch (err: any) {
    console.error('Receipt upload error:', err);
    res.status(500).json({ error: 'Failed to upload receipt screenshot' });
  }
});

// Mark Order as Received (Customer action)
router.patch('/:orderId/receive', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { orderId } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user!.id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Allow confirming receipt if order is pending, confirmed, tailoring, or out for delivery
    const allowedStates = ['PENDING', 'CONFIRMED', 'IN_EMBROIDERY', 'IN_TAILORING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'];
    if (!allowedStates.includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be marked as received in its current state.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' }
    });

    console.log(`[ORDER RECEIVED BY CLIENT] Order: ${order.orderNumber}`);

    res.json(updatedOrder);
  } catch (err: any) {
    console.error('Confirm order receipt error:', err);
    res.status(500).json({ error: 'Failed to confirm order receipt' });
  }
});

// Request Order Return (Customer action)
router.patch('/:orderId/return', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { orderId } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user!.id },
      include: { rentals: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Only delivered orders can be returned.' });
    }

    // Update order status to RETURN_REQUESTED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'RETURN_REQUESTED' }
    });

    // Also update any associated rentals status to RETURN_REQUESTED if they exist
    if (order.rentals && order.rentals.length > 0) {
      for (const rental of order.rentals) {
        await prisma.rentalDetail.update({
          where: { id: rental.id },
          data: { status: 'RETURN_REQUESTED' }
        });
      }
    }

    console.log(`[ORDER RETURN REQUESTED BY CLIENT] Order: ${order.orderNumber}`);

    res.json(updatedOrder);
  } catch (err: any) {
    console.error('Request order return error:', err);
    res.status(500).json({ error: 'Failed to submit return request' });
  }
});

export default router;
