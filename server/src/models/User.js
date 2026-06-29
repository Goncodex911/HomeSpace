import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['customer', 'store', 'admin'],
      default: 'customer',
    },
    vendorStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    companyName: {
      type: String,
      default: '',
    },
    businessType: {
      type: String,
      default: '',
    },
    taxId: {
      type: String,
      default: '',
    },
    yearsInIndustry: {
      type: Number,
      default: 0,
    },
    philosophy: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    occupation: {
      type: String,
      default: '',
    },
    streetAddress: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    zipCode: {
      type: String,
      default: '',
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    addresses: [
      {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    walletBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }

);

const User = mongoose.model('User', userSchema);

export default User;
