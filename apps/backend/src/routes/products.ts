import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get All Products
router.get('/', async (req, res) => {
  const { category, search } = req.query;

  try {
    const whereClause: any = {};

    if (category) {
      whereClause.category = String(category);
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search) } },
        { description: { contains: String(search) } }
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(products);
  } catch (err: any) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// Get Single Product by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        customizationOptions: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (err: any) {
    console.error('Fetch product detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve product details' });
  }
});

export default router;
