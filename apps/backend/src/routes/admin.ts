import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Secure all admin routes
router.use(authenticateToken);
router.use(requireRole(['ADMIN', 'STAFF']));

// Get All Orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { id: true, name: true, phoneNumber: true, email: true }
        },
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
    console.error('Admin fetch orders error:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// Update Order Status (Tailoring / Embroidery Workflow / Completion / Returns)
router.patch('/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // e.g. "IN_EMBROIDERY", "READY_FOR_DELIVERY", "DELIVERED", "COMPLETED", "RETURNED"

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData: any = { status };
    if (status === 'COMPLETED') {
      updateData.paymentStatus = 'PAID';
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { user: true, orderItems: true }
    });

    // If marked as RETURNED or CANCELLED, restore stock for order products (if not already done)
    if ((status === 'RETURNED' || status === 'CANCELLED') && order.status !== 'RETURNED' && order.status !== 'CANCELLED') {
      for (const item of updatedOrder.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity
            }
          }
        });
      }
    }

    // Mock notification triggers
    console.log(`\n--- [MOCK NOTIFICATION] Order ${updatedOrder.orderNumber} Status Updated ---`);
    console.log(`To: ${updatedOrder.user.name} (${updatedOrder.user.phoneNumber})`);
    console.log(`Message: Your Balochi dress order ${updatedOrder.orderNumber} is now: ${status}.`);
    console.log(`------------------------------------------------------------------\n`);

    res.json(updatedOrder);
  } catch (err: any) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Confirm/Verify Payment (Receipt screenshot verification)
router.patch('/orders/:orderId/payment', async (req, res) => {
  const { orderId } = req.params;
  const { paymentStatus } = req.body; // "PAID", "FAILED"

  if (!paymentStatus) {
    return res.status(400).json({ error: 'Payment status is required' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If payment is marked as PAID, automatically advance the order status from PENDING to CONFIRMED
    const updatedData: any = { paymentStatus };
    if (paymentStatus === 'PAID' && order.status === 'PENDING') {
      updatedData.status = 'CONFIRMED';
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updatedData,
      include: { user: true }
    });

    console.log(`[PAYMENT STATUS UPDATE] Order: ${updatedOrder.orderNumber}, Paid: ${paymentStatus}`);

    res.json(updatedOrder);
  } catch (err: any) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Get All System Rentals
router.get('/rentals', async (req, res) => {
  try {
    const rentals = await prisma.rentalDetail.findMany({
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, phoneNumber: true } },
            orderItems: { include: { product: true } }
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    res.json(rentals);
  } catch (err: any) {
    console.error('Fetch rentals error:', err);
    res.status(500).json({ error: 'Failed to retrieve rental list' });
  }
});

// Process Rental Returns or Dispatching (Returning a dress, or shipping it to customer)
router.patch('/rentals/:rentalId/return', async (req, res) => {
  const { rentalId } = req.params;
  const { status, lateFeeCharged, damageFeeCharged, notes } = req.body;
  // status should be "RETURNED_GOOD", "RETURNED_DAMAGED", or "RENTED_OUT"

  if (!status || !['RETURNED_GOOD', 'RETURNED_DAMAGED', 'RENTED_OUT'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (RETURNED_GOOD, RETURNED_DAMAGED, or RENTED_OUT) is required' });
  }

  try {
    const rental = await prisma.rentalDetail.findUnique({
      where: { id: rentalId },
      include: {
        order: {
          include: {
            orderItems: true
          }
        }
      }
    });

    if (!rental) {
      return res.status(404).json({ error: 'Rental detail not found' });
    }

    const updateData: any = { status };
    if (status !== 'RENTED_OUT') {
      updateData.actualReturnDate = new Date();
      updateData.lateFeeCharged = lateFeeCharged ? parseFloat(lateFeeCharged) : 0;
      updateData.damageFeeCharged = damageFeeCharged ? parseFloat(damageFeeCharged) : 0;
      updateData.notes = notes;
    }

    const updatedRental = await prisma.rentalDetail.update({
      where: { id: rentalId },
      data: updateData
    });

    // Restore stock for rented products ONLY on return
    if (status !== 'RENTED_OUT') {
      for (const item of rental.order.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity
            }
          }
        });
      }
    }

    console.log(`[RENTAL STATUS UPDATE] Rental ID: ${rentalId}, Status: ${status}`);

    res.json(updatedRental);
  } catch (err: any) {
    console.error('Update rental status error:', err);
    res.status(500).json({ error: 'Failed to record rental status update' });
  }
});

// Get Dashboard Analytics Summary
router.get('/stats', async (req, res) => {
  try {
    // Total Completed Sales revenue (excluding rentals or summing all cash flows)
    const paidOrders = await prisma.order.findMany({
      where: { paymentStatus: 'PAID' }
    });
    
    const totalSales = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Active Custom Embroidery / Tailoring count
    const pendingTailoringCount = await prisma.order.count({
      where: {
        status: {
          in: ['CONFIRMED', 'IN_EMBROIDERY', 'IN_TAILORING']
        }
      }
    });

    // Active Rentals out in Gwadar
    const activeRentalsCount = await prisma.rentalDetail.count({
      where: { status: 'RENTED_OUT' }
    });

    // Total counts
    const totalOrdersCount = await prisma.order.count();
    const totalProductsCount = await prisma.product.count();

    res.json({
      totalSales,
      pendingTailoringCount,
      activeRentalsCount,
      totalOrdersCount,
      totalProductsCount
    });
  } catch (err: any) {
    console.error('Fetch stats error:', err);
    res.status(500).json({ error: 'Failed to calculate analytics stats' });
  }
});

// Admin Add Product
router.post('/products', async (req, res) => {
  const { name, description, category, basePrice, stockQuantity, isRentable, rentPerDay, depositFee, allowsCustomEmbroidery, imageUrls, customizations } = req.body;

  if (!name || !description || !category || basePrice === undefined) {
    return res.status(400).json({ error: 'Name, description, category, and basePrice are required' });
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          category,
          basePrice: parseFloat(basePrice),
          stockQuantity: stockQuantity ?? 1,
          isRentable: isRentable ?? false,
          rentPerDay: rentPerDay ? parseFloat(rentPerDay) : null,
          depositFee: depositFee ? parseFloat(depositFee) : null,
          allowsCustomEmbroidery: allowsCustomEmbroidery ?? false
        }
      });

      // Add images
      if (imageUrls && Array.isArray(imageUrls)) {
        for (let i = 0; i < imageUrls.length; i++) {
          await tx.productImage.create({
            data: {
              productId: newProduct.id,
              url: imageUrls[i],
              isPrimary: i === 0
            }
          });
        }
      }

      // Add Customizations
      if (customizations && Array.isArray(customizations)) {
        // customizations format: [{ sectionName, optionName, priceMarkup }]
        for (const opt of customizations) {
          await tx.productCustomizationOption.create({
            data: {
              productId: newProduct.id,
              sectionName: opt.sectionName,
              optionName: opt.optionName,
              priceMarkup: parseFloat(opt.priceMarkup || 0)
            }
          });
        }
      }

      return newProduct;
    });

    res.status(201).json(product);
  } catch (err: any) {
    console.error('Admin create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update Product Stock
router.patch('/products/:productId/stock', async (req, res) => {
  const { productId } = req.params;
  const { stockQuantity } = req.body;

  if (stockQuantity === undefined) {
    return res.status(400).json({ error: 'Stock quantity is required' });
  }

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stockQuantity: parseInt(stockQuantity) }
    });

    res.json(updatedProduct);
  } catch (err: any) {
    console.error('Update stock error:', err);
    res.status(500).json({ error: 'Failed to update stock quantity' });
  }
// Get All Customers / Users List with order metadata
router.get('/customers', async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
        isBlacklisted: true,
        isOtpVerified: true,
        ipAddress: true,
        deviceFingerprint: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            status: true,
            totalAmount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format metadata (cancelled order count, etc.)
    const formatted = customers.map(u => {
      const cancelledCount = u.orders.filter(o => o.status === 'CANCELLED').length;
      const totalCount = u.orders.length;
      return {
        id: u.id,
        name: u.name,
        phoneNumber: u.phoneNumber,
        email: u.email,
        isBlacklisted: u.isBlacklisted,
        isOtpVerified: u.isOtpVerified,
        ipAddress: u.ipAddress,
        deviceFingerprint: u.deviceFingerprint,
        createdAt: u.createdAt,
        cancelledOrdersCount: cancelledCount,
        totalOrdersCount: totalCount
      };
    });

    res.json(formatted);
  } catch (err: any) {
    console.error('Fetch customers error:', err);
    res.status(500).json({ error: 'Failed to retrieve customers list' });
  }
});

// Blacklist/Whitelist User toggle
router.patch('/customers/:userId/blacklist', async (req, res) => {
  const { userId } = req.params;
  const { isBlacklisted } = req.body;

  if (isBlacklisted === undefined) {
    return res.status(400).json({ error: 'isBlacklisted status is required' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isBlacklisted: !!isBlacklisted }
    });

    res.json({
      success: true,
      message: `User ${updatedUser.name} has been successfully ${updatedUser.isBlacklisted ? 'blacklisted' : 'whitelisted'}.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        isBlacklisted: updatedUser.isBlacklisted
      }
    });
  } catch (err: any) {
    console.error('Blacklist user error:', err);
    res.status(500).json({ error: 'Failed to update user blacklist status' });
  }
});

// Update suspicious Order confirmation Call Status
router.patch('/orders/:orderId/confirmation', async (req, res) => {
  const { orderId } = req.params;
  const { confirmationStatus } = req.body; // "CONFIRMED", "REJECTED_FAKE"

  if (!confirmationStatus || !['CONFIRMED', 'REJECTED_FAKE'].includes(confirmationStatus)) {
    return res.status(400).json({ error: 'Invalid confirmation status. Must be CONFIRMED or REJECTED_FAKE.' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        confirmationStatus,
        status: confirmationStatus === 'REJECTED_FAKE' ? 'CANCELLED' : order.status
      },
      include: { orderItems: true }
    });

    // If marked as fake/cancelled, restore stock
    if (confirmationStatus === 'REJECTED_FAKE' && order.status !== 'CANCELLED') {
      for (const item of updatedOrder.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity
            }
          }
        });
      }
    }

    res.json({
      success: true,
      message: `Order confirmation status set to: ${confirmationStatus}.`,
      order: updatedOrder
    });
  } catch (err: any) {
    console.error('Update order confirmation status error:', err);
    res.status(500).json({ error: 'Failed to update order confirmation status' });
  }
});

export default router;
