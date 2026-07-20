import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Wallet from './src/models/Wallet.js';
import WithdrawalRequest from './src/models/WithdrawalRequest.js';

dotenv.config();

const DEMO_STORES = [
  'store@test.com',
  'curator@lumina.com',
  'nordica@lumina.com',
  'maison@lumina.com',
];

const WITHDRAWAL_TEMPLATES = [
  {
    amount: 350,
    bankName: 'Vietcombank',
    accountNumber: '0123456789',
    accountHolder: 'Test Store',
    status: 'accepted',
    daysAgo: 5,
    resolvedDaysAgo: 3,
  },
  {
    amount: 500,
    bankName: 'Techcombank',
    accountNumber: '9876543210',
    accountHolder: 'Test Store',
    status: 'accepted',
    daysAgo: 12,
    resolvedDaysAgo: 10,
  },
  {
    amount: 200,
    bankName: 'MB Bank',
    accountNumber: '5566778899',
    accountHolder: 'Test Store',
    status: 'rejected',
    daysAgo: 20,
    resolvedDaysAgo: 18,
    note: 'Account name does not match store profile.',
  },
  {
    amount: 125.5,
    bankName: 'VPBank',
    accountNumber: '2233445566',
    accountHolder: 'Test Store',
    status: 'accepted',
    daysAgo: 35,
    resolvedDaysAgo: 33,
  },
];

const WALLET_BALANCE = 2450.75;

const daysAgoDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const seedStoreWallet = async (store) => {
  await Wallet.findOneAndUpdate(
    { userId: store._id },
    { balance: WALLET_BALANCE, pendingBalance: 0 },
    { upsert: true, new: true }
  );

  await WithdrawalRequest.deleteMany({ store: store._id });

  for (const template of WITHDRAWAL_TEMPLATES) {
    const createdAt = daysAgoDate(template.daysAgo);
    const withdrawal = new WithdrawalRequest({
      store: store._id,
      amount: template.amount,
      bankName: template.bankName,
      accountNumber: template.accountNumber,
      accountHolder: template.accountHolder,
      status: template.status,
      note: template.note || '',
      createdAt,
      updatedAt: createdAt,
    });

    if (template.status !== 'pending' && template.resolvedDaysAgo != null) {
      withdrawal.resolvedAt = daysAgoDate(template.resolvedDaysAgo);
    }

    await withdrawal.save();
  }
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in server/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  let seeded = 0;

  for (const email of DEMO_STORES) {
    const store = await User.findOne({ email: email.toLowerCase(), role: 'store' });
    if (!store) {
      console.log(`Skip: store not found (${email})`);
      continue;
    }

    await seedStoreWallet(store);
    seeded += 1;
    console.log(`Wallet demo seeded for ${email} — balance $${WALLET_BALANCE}, ${WITHDRAWAL_TEMPLATES.length} withdrawals`);
  }

  console.log('--------------------------------------------------');
  console.log(`Done: ${seeded} store wallet(s) ready for demo`);
  console.log('Login: store@test.com / 123456 → Store Wallet tab');
  console.log('--------------------------------------------------');

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
