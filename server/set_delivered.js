import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order.js';

dotenv.config();

const updateLatestOrderToDelivered = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lumina');

    const latestOrder = await Order.findOne().sort({ createdAt: -1 });
    
    if (!latestOrder) {
      console.log('Không tìm thấy đơn hàng nào trong database!');
      process.exit(0);
    }

    latestOrder.status = 'delivered';
    await latestOrder.save();

    console.log(`Thành công! Đã chuyển trạng thái đơn hàng ${latestOrder._id} thành 'delivered'.`);
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
};

updateLatestOrderToDelivered();
