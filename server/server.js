import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './src/app.js';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const seedAdminUser = async () => {
  try {
    const adminEmail = 'admin@lumina.com';
    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('adminpassword123', salt);
      
      const newAdmin = new User({
        fullName: 'Lumina Admin',
        email: adminEmail,
        password: hashedPassword,
        isVerified: true,
        role: 'admin',
        vendorStatus: 'none',
      });
      
      await newAdmin.save();
      console.log('--------------------------------------------------');
      console.log('TEST ADMIN ACCOUNT SEEDED SUCCESSFULLY!');
      console.log('Email: admin@lumina.com');
      console.log('Password: adminpassword123');
      console.log('--------------------------------------------------');
    } else {
      console.log('Test Admin Account already exists.');
    }
  } catch (err) {
    console.error('Failed to seed admin user:', err.message);
  }
};

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB Connected");
        await seedAdminUser();
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });

app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});