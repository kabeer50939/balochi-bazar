import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'bazar_local_secret_key_gwadar_doch';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phoneNumber: string;
    role: string;
    name: string;
  };
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; phoneNumber: string; role: string; name: string };
    
    // Double check user exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, phoneNumber: true, role: true, name: true }
    });

    if (!user) {
      return res.status(403).json({ error: 'User not found or deleted' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
}
