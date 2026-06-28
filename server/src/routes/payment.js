import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import payOS from '../utils/payos.js';
import { protect } from '../middlewares/auth.js';


const router = express.Router();

// Tạo liên kết thanh toán PayOS
router.post('/create-payment-link', protect, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    // items là mảng chứa: { itemId, quantity }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items selected for checkout' });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      return res.status(400).json({ message: 'Shipping address details are required' });
    }

    // Kiểm tra và tự động lưu địa chỉ mới vào Database của người dùng nếu chưa có
    const userInDb = await User.findById(req.user._id);
    if (userInDb) {
      const addressExists = (userInDb.addresses || []).some(
        (addr) =>
          addr.fullName === shippingAddress.fullName &&
          addr.phone === shippingAddress.phone &&
          addr.address === shippingAddress.address
      );

      if (!addressExists) {
        const isFirst = (userInDb.addresses || []).length === 0;
        userInDb.addresses = userInDb.addresses || [];
        userInDb.addresses.push({
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          isDefault: isFirst,
        });
        await userInDb.save();
      }
    }


    // Lấy thông tin chi tiết và tính tổng tiền
    let totalAmount = 0;
    const orderItems = [];
    const itemIdsToRemove = [];

    for (const selectedItem of items) {
      const dbItem = await Item.findById(selectedItem.itemId);
      if (!dbItem) {
        return res.status(404).json({ message: `Item with ID ${selectedItem.itemId} not found` });
      }

      if (dbItem.quantity < selectedItem.quantity) {
        return res.status(400).json({
          message: `Product "${dbItem.name}" only has ${dbItem.quantity} units left in stock.`,
        });
      }

      const itemTotal = dbItem.price * selectedItem.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        item: dbItem._id,
        name: dbItem.name,
        quantity: selectedItem.quantity,
        price: dbItem.price,
        owner: dbItem.owner,
      });

      itemIdsToRemove.push(dbItem._id.toString());
    }

    // Tạo mã đơn hàng độc nhất dưới dạng số nguyên (Yêu cầu bắt buộc của PayOS)
    const orderCode = Number(String(Date.now()).slice(-9)) + Math.floor(Math.random() * 1000);

    // Tạo đơn hàng mới trong DB
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      orderCode,
      paymentStatus: 'PENDING',
    });

    await order.save();

    // Chuẩn bị dữ liệu thanh toán gửi đến PayOS
    const returnUrl = process.env.PAYOS_RETURN_URL || 'http://localhost:5173/cart?status=success';
    const cancelUrl = process.env.PAYOS_CANCEL_URL || 'http://localhost:5173/cart?status=cancel';

    let checkoutUrl = '';
    
    if (payOS) {
      const paymentData = {
        orderCode,
        amount: totalAmount,
        description: `ATELIER ORDER ${orderCode}`,
        items: orderItems.map((i) => ({
          name: i.name.length > 25 ? i.name.slice(0, 22) + '...' : i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        returnUrl: `${returnUrl}&orderCode=${orderCode}`,
        cancelUrl: `${cancelUrl}&orderCode=${orderCode}`,
      };

      const paymentResponse = await payOS.paymentRequests.create(paymentData);
      checkoutUrl = paymentResponse.checkoutUrl;
      order.paymentLinkId = paymentResponse.paymentLinkId;
      await order.save();

    } else {
      // Chế độ Giả lập (Mock) gửi link tới màn hình thanh toán giả lập trên frontend
      checkoutUrl = `http://localhost:5173/mock-payment?orderCode=${orderCode}&amount=${totalAmount}`;
      console.log(`[Mock Checkout Url]: ${checkoutUrl}`);
    }


    // Cập nhật số lượng sản phẩm trong kho (trừ bớt)
    for (const orderItem of orderItems) {
      await Item.findByIdAndUpdate(orderItem.item, {
        $inc: { quantity: -orderItem.quantity },
      });
    }

    // Xóa các sản phẩm này khỏi giỏ hàng của người dùng
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = cart.items.filter((cartItem) => !itemIdsToRemove.includes(cartItem.item.toString()));
      await cart.save();
    }

    res.status(200).json({
      message: 'Order created successfully',
      checkoutUrl,
      orderCode,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Xem lịch sử đơn hàng của người dùng
router.get('/orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      message: 'Orders retrieved successfully',
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Giả lập/Xác nhận thanh toán thành công (Cho việc test nhanh ở frontend hoặc khi mock)
router.post('/confirm-payment', protect, async (req, res) => {
  try {
    const { orderCode, status } = req.body;
    const order = await Order.findOne({ orderCode });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = status === 'success' ? 'PAID' : 'CANCELLED';
    await order.save();

    res.status(200).json({
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Webhook từ PayOS khi thanh toán thay đổi trạng thái
router.post('/webhook', async (req, res) => {
  try {
    if (!payOS) {
      return res.status(400).json({ message: 'PayOS SDK is not configured' });
    }

    const webhookData = await payOS.webhooks.verify(req.body);
    const { orderCode, success } = webhookData;


    const order = await Order.findOne({ orderCode });
    if (order) {
      order.paymentStatus = success ? 'PAID' : 'CANCELLED';
      await order.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

export default router;
