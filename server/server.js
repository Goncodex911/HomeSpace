import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './src/app.js';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyPath = path.resolve(__dirname, '../key.pem');
const certPath = path.resolve(__dirname, '../cert.pem');

let credentials = {};
try {
  credentials = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
} catch (error) {
  console.error('Error reading SSL certificates. Make sure key.pem and cert.pem exist in the project root.', error);
}

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

        if (credentials.key && credentials.cert) {
            const httpsServer = https.createServer(credentials, app);
            httpsServer.listen(PORT, '0.0.0.0', () => {
                console.log(`HTTPS Server running on https://0.0.0.0:${PORT}`);
            });
            // Extra HTTP port for Expo / React Native (avoids self-signed SSL issues)
            const httpPort = Number(PORT) + 1;
            app.listen(httpPort, '0.0.0.0', () => {
                console.log(`HTTP Server (Expo) running on http://0.0.0.0:${httpPort}`);
            });
        } else {
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`HTTP Server running on http://0.0.0.0:${PORT}`);
            });
        }
    })
    .catch((err) => {
        console.log(err);
    });