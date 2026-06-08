import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST /api/auth/register
// @desc    Register a new user (generates verification OTP)
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Create User (not verified yet)
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      isVerified: false,
      role: 'customer',
      otp,
      otpExpires,
    });

    await newUser.save();

    // Send Real Email or console log simulation
    await sendEmail({
      to: email,
      subject: 'Lumina Atelier - Verify Your Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e5e1; background-color: #faf9f5; color: #1a1c1a;">
          <h2 style="font-family: 'Montserrat', sans-serif; font-weight: 300; text-align: center; color: #000000;">LUMINA ATELIER</h2>
          <hr style="border: 0; border-top: 1px solid #c4c7c7; margin-bottom: 20px;" />
          <p>Dear ${fullName},</p>
          <p>Thank you for creating an account with Lumina Atelier. Please use the following 6-digit OTP code to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #eeeeea; padding: 10px 20px; border: 1px solid #c4c7c7; color: #000000;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #747878;">This code is valid for 10 minutes. If you did not request this registration, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e5e1; margin-top: 20px;" />
          <p style="font-size: 10px; text-align: center; color: #747878;">&copy; 2024 Lumina Marketplace. All rights reserved.</p>
        </div>
      `
    });

    res.status(201).json({
      message: 'Registration successful. Please verify your email with the OTP sent.',
      email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify registration OTP and activate user
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Check OTP validation
    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    // Mark as verified & clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'homespace_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend registration OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Regenerate OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send Real Email or console log simulation
    await sendEmail({
      to: email,
      subject: 'Lumina Atelier - Verify Your Account (Resend)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e5e1; background-color: #faf9f5; color: #1a1c1a;">
          <h2 style="font-family: 'Montserrat', sans-serif; font-weight: 300; text-align: center; color: #000000;">LUMINA ATELIER</h2>
          <hr style="border: 0; border-top: 1px solid #c4c7c7; margin-bottom: 20px;" />
          <p>Dear ${user.fullName},</p>
          <p>As requested, here is your resent 6-digit OTP code to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #eeeeea; padding: 10px 20px; border: 1px solid #c4c7c7; color: #000000;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #747878;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e5e1; margin-top: 20px;" />
          <p style="font-size: 10px; text-align: center; color: #747878;">&copy; 2024 Lumina Marketplace. All rights reserved.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'OTP code resent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Log in user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if verified
    if (!user.isVerified) {
      // Regenerate OTP so they can verify right away
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      // Send Real Email or console log simulation
      await sendEmail({
        to: email,
        subject: 'Lumina Atelier - Verify Your Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e5e1; background-color: #faf9f5; color: #1a1c1a;">
            <h2 style="font-family: 'Montserrat', sans-serif; font-weight: 300; text-align: center; color: #000000;">LUMINA ATELIER</h2>
            <hr style="border: 0; border-top: 1px solid #c4c7c7; margin-bottom: 20px;" />
            <p>Dear ${user.fullName},</p>
            <p>You tried to log in but your email has not been verified yet. Please use the following 6-digit OTP code to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #eeeeea; padding: 10px 20px; border: 1px solid #c4c7c7; color: #000000;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #747878;">This code is valid for 10 minutes.</p>
            <hr style="border: 0; border-top: 1px solid #e5e5e1; margin-top: 20px;" />
            <p style="font-size: 10px; text-align: center; color: #747878;">&copy; 2024 Lumina Marketplace. All rights reserved.</p>
          </div>
        `
      });

      return res.status(403).json({
        message: 'Account not verified. Please check your email for the verification OTP.',
        unverified: true,
        email: user.email,
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'homespace_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request a password reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Use OTP for reset as well
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send Real Email or console log simulation
    await sendEmail({
      to: email,
      subject: 'Lumina Atelier - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e5e1; background-color: #faf9f5; color: #1a1c1a;">
          <h2 style="font-family: 'Montserrat', sans-serif; font-weight: 300; text-align: center; color: #000000;">LUMINA ATELIER</h2>
          <hr style="border: 0; border-top: 1px solid #c4c7c7; margin-bottom: 20px;" />
          <p>Dear ${user.fullName},</p>
          <p>We received a request to reset your password. Please use the following 6-digit OTP code to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #eeeeea; padding: 10px 20px; border: 1px solid #c4c7c7; color: #000000;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #747878;">This code is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e5e1; margin-top: 20px;" />
          <p style="font-size: 10px; text-align: center; color: #747878;">&copy; 2024 Lumina Marketplace. All rights reserved.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'Password reset OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    
    // Auto-verify if they were somehow unverified
    user.isVerified = true;
    
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully. Please log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
