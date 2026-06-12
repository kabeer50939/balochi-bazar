import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'bazar_local_secret_key_gwadar_doch';

// Register User
router.post('/register', async (req, res) => {
  const { phoneNumber, password, name, email, sectorName, streetAddress, landmark, otpCode } = req.body;

  if (!phoneNumber || !password || !name) {
    return res.status(400).json({ error: 'Phone number, password, and name are required' });
  }

  // Mobile number OTP Verification
  if (!otpCode || otpCode !== '8899') {
    return res.status(400).json({ error: 'Mobile verification code check failed. Please enter the valid OTP 8899.' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // IP & Device fingerprint limit: max 3 accounts from same IP/Device in 24 hours
    const ipAddress = req.ip || 'unknown';
    const deviceFingerprint = req.headers['user-agent'] || 'unknown';

    const recentRegistrations = await prisma.user.count({
      where: {
        OR: [
          { ipAddress },
          { deviceFingerprint }
        ],
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (recentRegistrations >= 3) {
      return res.status(429).json({ error: 'Security alert: Too many registrations from this device/network in 24 hours to prevent duplicate fake accounts.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and initial address inside transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          phoneNumber,
          passwordHash,
          name,
          email,
          role: 'CUSTOMER',
          isOtpVerified: true,
          emailVerified: email ? true : false,
          ipAddress,
          deviceFingerprint
        }
      });

      if (sectorName && streetAddress) {
        await tx.address.create({
          data: {
            userId: newUser.id,
            sectorName,
            streetAddress,
            landmark,
            isDefault: true
          }
        });
      }

      return newUser;
    });

    // Mock SMS Verification
    console.log(`\n--- [MOCK SMS SENT TO ${phoneNumber}] ---`);
    console.log(`Welcome to Bazar, ${name}! Your local verification OTP is: 8899`);
    console.log(`-----------------------------------------\n`);

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, phoneNumber: user.phoneNumber, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Error creating user' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { phoneNumber, password } = req.body; // phoneNumber is treated as a generic identifier (phone or email)

  if (!phoneNumber || !password) {
    return res.status(400).json({ error: 'Username (phone or email) and password are required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: phoneNumber },
          { email: phoneNumber }
        ]
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid username (phone or email) or password' });
    }

    if (user.isBlacklisted) {
      return res.status(403).json({ error: 'Access denied. This account has been blacklisted due to multiple fake orders or delivery refusals.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid username (phone or email) or password' });
    }

    // Update IP & Device Fingerprint
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ipAddress: req.ip || 'unknown',
        deviceFingerprint: req.headers['user-agent'] || 'unknown'
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, phoneNumber: user.phoneNumber, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Error authenticating user' });
  }
});

// Login via SMS OTP
router.post('/otp-login', async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  if (!phoneNumber || !otpCode) {
    return res.status(400).json({ error: 'Phone number and OTP code are required' });
  }

  if (otpCode !== '8899') {
    return res.status(400).json({ error: 'Invalid verification OTP code. For testing, use 8899.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber }
    });

    if (!user) {
      return res.status(400).json({ error: 'This phone number is not registered. Please sign up first.' });
    }

    if (user.isBlacklisted) {
      return res.status(403).json({ error: 'Access denied. This account has been blacklisted due to multiple fake orders or delivery refusals.' });
    }

    // Update IP & Device Fingerprint
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ipAddress: req.ip || 'unknown',
        deviceFingerprint: req.headers['user-agent'] || 'unknown'
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, phoneNumber: user.phoneNumber, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });
  } catch (err: any) {
    console.error('OTP Login error:', err);
    res.status(500).json({ error: err.message || 'Error authenticating user via OTP' });
  }
});

// Get Current User Profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        email: true,
        role: true,
        addresses: true,
        createdAt: true
      }
    });

    res.json(userProfile);
  } catch (err: any) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Add Address
router.post('/address', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { sectorName, streetAddress, landmark, isDefault } = req.body;

  if (!sectorName || !streetAddress) {
    return res.status(400).json({ error: 'Sector name and street address are required' });
  }

  try {
    if (isDefault) {
      // Set all other user addresses to isDefault = false
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: req.user!.id,
        sectorName,
        streetAddress,
        landmark,
        isDefault: isDefault ?? false
      }
    });

    res.status(201).json(newAddress);
  } catch (err: any) {
    console.error('Add address error:', err);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

export default router;
