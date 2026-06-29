import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import { protect } from '../middlewares/auth.js';

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
        vendorStatus: user.vendorStatus,
        companyName: user.companyName,
        businessType: user.businessType,
        taxId: user.taxId,
        yearsInIndustry: user.yearsInIndustry,
        philosophy: user.philosophy,
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
        vendorStatus: user.vendorStatus,
        companyName: user.companyName,
        businessType: user.businessType,
        taxId: user.taxId,
        yearsInIndustry: user.yearsInIndustry,
        philosophy: user.philosophy,
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

// @route   GET /api/auth/profile
// @desc    Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { fullName, email, phone, occupation, streetAddress, city, state, zipCode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use by another user' });
      }
      user.email = email;
    }

    if (fullName) user.fullName = fullName;
    user.phone = phone !== undefined ? phone : user.phone;
    user.occupation = occupation !== undefined ? occupation : user.occupation;
    user.streetAddress = streetAddress !== undefined ? streetAddress : user.streetAddress;
    user.city = city !== undefined ? city : user.city;
    user.state = state !== undefined ? state : user.state;
    user.zipCode = zipCode !== undefined ? zipCode : user.zipCode;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        occupation: user.occupation,
        streetAddress: user.streetAddress,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        isVerified: user.isVerified,
        role: user.role,
        vendorStatus: user.vendorStatus,
        companyName: user.companyName,
        businessType: user.businessType,
        taxId: user.taxId,
        yearsInIndustry: user.yearsInIndustry,
        philosophy: user.philosophy,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/apply-vendor
// @desc    Submit application to become a vendor
// @access  Private
router.post('/apply-vendor', protect, async (req, res) => {
  try {
    const { companyName, businessType, taxId, yearsInIndustry, philosophy, fullName, phone } = req.body;

    if (!companyName || !businessType || !taxId || !yearsInIndustry || !philosophy) {
      return res.status(400).json({ message: 'Please enter all business details' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update optional contact info if submitted
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;

    // Update business info
    user.companyName = companyName;
    user.businessType = businessType;
    user.taxId = taxId;
    user.yearsInIndustry = yearsInIndustry;
    user.philosophy = philosophy;
    user.vendorStatus = 'pending';

    await user.save();

    res.status(200).json({
      message: 'Vendor application submitted successfully. Pending admin approval.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        role: user.role,
        vendorStatus: user.vendorStatus,
        companyName: user.companyName,
        businessType: user.businessType,
        taxId: user.taxId,
        yearsInIndustry: user.yearsInIndustry,
        philosophy: user.philosophy,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/admin/vendor-applications
// @desc    Get all vendor applications (Admin only)
// @access  Private
router.get('/admin/vendor-applications', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const applications = await User.find({ vendorStatus: { $ne: 'none' } }).select('-password');
    res.status(200).json({ data: applications, applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/auth/admin/approve-vendor/:id
// @desc    Approve a vendor application (Admin only)
// @access  Private
router.put('/admin/approve-vendor/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.vendorStatus !== 'pending') {
      return res.status(400).json({ message: `Cannot approve user in '${user.vendorStatus}' status` });
    }

    user.vendorStatus = 'approved';
    user.role = 'store';
    await user.save();

    // Send congratulatory email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Lumina Atelier - Vendor Application Approved!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e5e1; background-color: #faf9f5; color: #1a1c1a;">
            <h2 style="font-family: 'Montserrat', sans-serif; font-weight: 300; text-align: center; color: #000000;">LUMINA ATELIER</h2>
            <hr style="border: 0; border-top: 1px solid #c4c7c7; margin-bottom: 20px;" />
            <p>Dear ${user.fullName},</p>
            <p>We are thrilled to inform you that your vendor application for <strong>Lumina Atelier</strong> has been approved!</p>
            <p>Your account has been upgraded to a Curator Partner. You can now access your Store Manager panel to manage your furniture pieces and showcase your craftsmanship.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://localhost:5173/store" style="background-color: #000000; color: #ffffff; padding: 15px 30px; text-decoration: none; font-family: 'Montserrat', sans-serif; font-weight: bold; font-size: 14px; letter-spacing: 2px;">ACCESS STORE MANAGER</a>
            </div>
            <p style="font-size: 12px; color: #747878;">Welcome to our exclusive inner circle. We look forward to curating your finest work.</p>
            <hr style="border: 0; border-top: 1px solid #e5e5e1; margin-top: 20px;" />
            <p style="font-size: 10px; text-align: center; color: #747878;">&copy; 2024 Lumina Marketplace. All rights reserved.</p>
          </div>
        `
      });
    } catch (mailError) {
      console.error('Failed to send approval email:', mailError.message);
    }

    res.status(200).json({
      message: 'User vendor application approved and role upgraded to store successfully.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        vendorStatus: user.vendorStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/auth/admin/reject-vendor/:id
// @desc    Reject a vendor application (Admin only)
// @access  Private
router.put('/admin/reject-vendor/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.vendorStatus !== 'pending') {
      return res.status(400).json({ message: `Cannot reject user in '${user.vendorStatus}' status` });
    }

    user.vendorStatus = 'rejected';
    await user.save();

    // Send rejection email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Lumina Atelier - Application Update',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e5e1; background-color: #faf9f5; color: #1a1c1a;">
            <h2 style="font-family: 'Montserrat', sans-serif; font-weight: 300; text-align: center; color: #000000;">LUMINA ATELIER</h2>
            <hr style="border: 0; border-top: 1px solid #c4c7c7; margin-bottom: 20px;" />
            <p>Dear ${user.fullName},</p>
            <p>Thank you for your interest in joining Lumina Atelier as a Curator. We have carefully reviewed your application and brand philosophy.</p>
            <p>Unfortunately, we are unable to accept your application at this time as it does not fully align with our current seasonal design direction.</p>
            <p>We appreciate the time you took to share your work with us. You are welcome to re-apply in the future as our curated collections expand.</p>
            <hr style="border: 0; border-top: 1px solid #e5e5e1; margin-top: 20px;" />
            <p style="font-size: 10px; text-align: center; color: #747878;">&copy; 2024 Lumina Marketplace. All rights reserved.</p>
          </div>
        `
      });
    } catch (mailError) {
      console.error('Failed to send rejection email:', mailError.message);
    }

    res.status(200).json({
      message: 'User vendor application rejected successfully.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        vendorStatus: user.vendorStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- ADDRESSES CRUD ENDPOINTS ---

// Lấy danh sách địa chỉ của người dùng
router.get('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'Addresses retrieved successfully',
      data: user.addresses || [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Thêm địa chỉ mới
router.post('/addresses', protect, async (req, res) => {
  try {
    const { fullName, phone, address, isDefault } = req.body;
    if (!fullName || !phone || !address) {
      return res.status(400).json({ message: 'fullName, phone and address are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Nếu đây là địa chỉ đầu tiên hoặc được thiết lập mặc định, set các địa chỉ khác thành không mặc định
    const makeDefault = isDefault || user.addresses.length === 0;
    if (makeDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    const newAddress = {
      fullName,
      phone,
      address,
      isDefault: makeDefault,
    };

    user.addresses.push(newAddress);
    await user.save();

    // Trả về địa chỉ mới thêm (lấy phần tử cuối cùng)
    const addedAddress = user.addresses[user.addresses.length - 1];

    res.status(201).json({
      message: 'Address added successfully',
      data: addedAddress,
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cập nhật địa chỉ
router.put('/addresses/:id', protect, async (req, res) => {
  try {
    const { fullName, phone, address, isDefault } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addr = user.addresses.id(req.params.id);
    if (!addr) {
      return res.status(404).json({ message: 'Address not found' });
    }

    if (fullName) addr.fullName = fullName;
    if (phone) addr.phone = phone;
    if (address) addr.address = address;

    if (isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
      addr.isDefault = true;
    }

    await user.save();
    res.status(200).json({
      message: 'Address updated successfully',
      data: addr,
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Xóa địa chỉ
router.delete('/addresses/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addr = user.addresses.id(req.params.id);
    if (!addr) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const wasDefault = addr.isDefault;
    user.addresses.pull(req.params.id);

    // Nếu xóa địa chỉ mặc định, set địa chỉ đầu tiên còn lại làm mặc định
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.status(200).json({
      message: 'Address deleted successfully',
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Đặt làm địa chỉ mặc định
router.put('/addresses/:id/default', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addr = user.addresses.id(req.params.id);
    if (!addr) {
      return res.status(404).json({ message: 'Address not found' });
    }

    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
    addr.isDefault = true;

    await user.save();
    res.status(200).json({
      message: 'Default address updated successfully',
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Đăng nhập hoặc đăng ký nhanh qua mạng xã hội (Google / Facebook)
router.post('/social-login', async (req, res) => {
  try {
    const { email, fullName, provider } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ message: 'Email and full name are required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    } else {
      // Tạo user mới
      const randomPassword = Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        fullName,
        email: email.toLowerCase(),
        password: hashedPassword,
        isVerified: true,
        role: 'customer',
      });
      await user.save();
    }

    // Tạo JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'homespace_secret',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Social login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        vendorStatus: user.vendorStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


