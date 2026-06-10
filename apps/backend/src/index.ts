import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve local upload files static folder
app.use('/uploads', express.static(uploadsDir));

// Serve mobile preview web application statically
app.use('/mobile-preview', express.static(path.join(__dirname, '../../mobile-preview')));

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Bazar Local API Service for Gwadar!' });
});

// Import route modules
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`[Bazar Server] Running locally on: http://localhost:${PORT}`);
  console.log(`[Bazar Server] Local uploads serving at: http://localhost:${PORT}/uploads`);
});
