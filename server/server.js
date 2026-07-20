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

const TEST_ACCOUNTS = [
  {
    email: 'admin@lumina.com',
    password: 'adminpassword123',
    fullName: 'Lumina Admin',
    role: 'admin',
    vendorStatus: 'none',
  },
  {
    email: 'customer@test.com',
    password: '123456',
    fullName: 'Test Customer',
    role: 'customer',
    vendorStatus: 'none',
  },
  {
    email: 'store@test.com',
    password: '123456',
    fullName: 'Test Store',
    role: 'store',
    vendorStatus: 'approved',
    companyName: 'Test Atelier',
  },
];

const seedTestAccounts = async () => {
  try {
    for (const account of TEST_ACCOUNTS) {
      const email = account.email.toLowerCase();
      const existing = await User.findOne({ email });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(account.password, salt);

      if (!existing) {
        await new User({
          fullName: account.fullName,
          email,
          password: hashedPassword,
          isVerified: true,
          role: account.role,
          vendorStatus: account.vendorStatus,
          companyName: account.companyName || '',
        }).save();
        console.log(`Test account created: ${email}`);
      } else {
        existing.password = hashedPassword;
        existing.isVerified = true;
        existing.role = account.role;
        existing.vendorStatus = account.vendorStatus;
        if (account.companyName) existing.companyName = account.companyName;
        await existing.save();
        console.log(`Test account ready: ${email}`);
      }
    }

    console.log('--------------------------------------------------');
    console.log('TEST ACCOUNTS');
    console.log('Admin:    admin@lumina.com / adminpassword123');
    console.log('Customer: customer@test.com / 123456');
    console.log('Store:    store@test.com / 123456');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('Failed to seed test accounts:', err.message);
  }
};

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB Connected");
        await seedTestAccounts();

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