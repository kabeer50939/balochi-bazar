import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'bazar_local_secret_key_gwadar_doch';

// Nodemailer SMTP Transporter helper with log fallback
const sendOtpEmail = async (email: string, otpCode: string): Promise<boolean> => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'no-reply@balochi-bazar.com';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="background-color: #F85606; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">BALOCHI BAZAR</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        <h2 style="color: #333333; margin-top: 0; font-size: 20px; font-weight: bold;">Verify Your Email Address</h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
          Thank you for choosing Balochi Bazar. Use the following one-time passcode (OTP) to complete your verification process. This code is valid for 5 minutes:
        </p>
        <div style="background-color: #f4f6f8; border-left: 4px solid #1a9cb7; padding: 16px; text-align: center; border-radius: 4px; margin-bottom: 28px;">
          <span style="font-size: 32px; font-weight: bold; color: #F85606; letter-spacing: 4px;">${otpCode}</span>
        </div>
        <p style="color: #999999; font-size: 13px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #eeeeee; padding-top: 16px;">
          If you did not request this code, please ignore this email or contact support if you have security concerns.
        </p>
      </div>
      <div style="background-color: #f8f8f8; padding: 16px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee;">
        &copy; 2026 Balochi Bazar. All rights reserved. Gwadar, Balochistan.
      </div>
    </div>
  `;

  // Write OTP to persistent scratch logs (local environment only)
  if (!process.env.VERCEL) {
    try {
      const logMessage = `[EMAIL OTP LOG] Time: ${new Date().toISOString()} | To: ${email} | Code: ${otpCode}\n`;
      const scratchDir = 'C:\\Users\\kabee\\.gemini\\antigravity\\brain\\66c63025-46bd-488b-bccd-469db135ddf3\\scratch';
      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir, { recursive: true });
      }
      fs.appendFileSync(path.join(scratchDir, 'email_otp_log.txt'), logMessage);
    } catch (fsErr) {
      console.error('Failed to write local OTP scratch log:', fsErr);
    }
  }

  console.log(`\n-----------------------------------------`);
  console.log(`[EMAIL SENT TO CONSOLE]`);
  console.log(`To: ${email}`);
  console.log(`Subject: Balochi Bazar Verification Code`);
  console.log(`OTP Code: ${otpCode}`);
  console.log(`-----------------------------------------\n`);

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: `${otpCode} is your Balochi Bazar verification code`,
        html: htmlContent
      });

      return true;
    } catch (err) {
      console.error('Nodemailer failed to send email, fell back to console/log log:', err);
    }
  }

  return false;
};

// Register User
router.post('/register', async (req, res) => {
  const { phoneNumber, password, name, email, sectorName, streetAddress, landmark, otpCode } = req.body;

  if (!phoneNumber || !password || !name) {
    return res.status(400).json({ error: 'Phone number, password, and name are required' });
  }

  // Format validation: Email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. customer@example.com)' });
  }

  // Format validation: Phone Number (XXXX-XXXXXXX)
  const phoneRegex = /^\d{4}-\d{7}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ error: 'Please enter a valid phone number in the format XXXX-XXXXXXX (e.g. 0332-7579515)' });
  }

  // Verification code check: If email is provided, check EmailOtp table. Else fallback to mobile mock code.
  if (email) {
    try {
      const dbOtp = await prisma.emailOtp.findUnique({
        where: { email }
      });

      if (!dbOtp || dbOtp.otpCode !== otpCode || dbOtp.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired email verification code. Please request a new one.' });
      }

      // Delete the verified OTP
      await prisma.emailOtp.delete({
        where: { email }
      });
    } catch (err) {
      console.error('Email OTP verify error during signup:', err);
      return res.status(400).json({ error: 'Failed to verify email OTP code.' });
    }
  } else {
    // Fallback phone verification for backward compatibility / future phone gateway
    if (!otpCode || otpCode !== '8899') {
      return res.status(400).json({ error: 'Mobile verification code check failed. Please enter the valid OTP 8899.' });
    }
  }

  try {
    // Check if user already exists (both phone and email unique constraints)
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email address already registered' });
      }
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

// Send 6-digit OTP to Email
router.post('/send-otp', async (req, res) => {
  const { email, type } = req.body; // type: 'REGISTER' or 'LOGIN'

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. customer@example.com).' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (type === 'REGISTER' && existingUser) {
      return res.status(400).json({ error: 'Email address already registered. Please login instead.' });
    }

    if (type === 'LOGIN' && !existingUser) {
      return res.status(400).json({ error: 'No account registered with this email. Please sign up first.' });
    }

    // Generate secure 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Upsert the OTP in database
    await prisma.emailOtp.upsert({
      where: { email },
      update: { otpCode, expiresAt, createdAt: new Date() },
      create: { email, otpCode, expiresAt }
    });

    // Send email
    const sentReal = await sendOtpEmail(email, otpCode);

    if (!sentReal) {
      if (process.env.VERCEL) {
        return res.status(500).json({
          error: 'Email delivery failed. SMTP credentials are not configured on Vercel. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in Vercel project environment variables.'
        });
      } else {
        return res.json({
          success: true,
          message: 'Local fallback: SMTP is not configured. The verification code has been written to your console and local logs.'
        });
      }
    }

    res.json({
      success: true,
      message: 'Verification code sent successfully. Please check your email inbox.'
    });

  } catch (err: any) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP verification code' });
  }
});

// Verify Email OTP & Login (Passwordless)
router.post('/email-otp-login', async (req, res) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    // Check database OTP
    const dbOtp = await prisma.emailOtp.findUnique({
      where: { email }
    });

    if (!dbOtp || dbOtp.otpCode !== otpCode || dbOtp.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    // Find User
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'No account found with this email.' });
    }

    if (user.isBlacklisted) {
      return res.status(403).json({ error: 'Access denied. This account has been blacklisted.' });
    }

    // Delete verified OTP code
    await prisma.emailOtp.delete({
      where: { email }
    });

    // Update IP & Device Fingerprint
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ipAddress: req.ip || 'unknown',
        deviceFingerprint: req.headers['user-agent'] || 'unknown',
        emailVerified: true,
        isOtpVerified: true
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
    console.error('Email OTP Login error:', err);
    res.status(500).json({ error: 'Error authenticating user via Email OTP' });
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
// Trigger Vercel rebuild for SMTP environment variables update
