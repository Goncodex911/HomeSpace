import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import payOS from '../utils/payos.js';
import { protect, isAdmin } from '../middlewares/auth.js';


const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Cộng tiền vào ví của từng store khi đơn hàng được thanh toán
// ─────────────────────────────────────────────────────────────────────────────
const creditStoreWallets = async (order) => {
  try {
    // Nhóm items theo từng store
    const storeMap = {}; // { storeId: totalAmount }
    for (const orderItem of order.items) {
      if (orderItem.store) {
        const storeId = orderItem.store.toString();
        const earned = orderItem.price * orderItem.quantity;
        storeMap[storeId] = (storeMap[storeId] || 0) + earned;
      }
    }

    // Cộng tiền vào ví từng store
    for (const [storeId, amount] of Object.entries(storeMap)) {
      await Wallet.findOneAndUpdate(
        { userId: storeId },
        { $inc: { balance: amount } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[WALLET CREDIT] Store ${storeId} +${amount.toLocaleString('vi-VN')} ₫`);
    }
  } catch (err) {
    console.error('[WALLET CREDIT ERROR]', err.message);
  }
};


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
    const returnUrl = process.env.PAYOS_RETURN_URL || 'https://localhost:5173/cart?status=success';
    const cancelUrl = process.env.PAYOS_CANCEL_URL || 'https://localhost:5173/cart?status=cancel';

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
      checkoutUrl = `https://localhost:5173/mock-payment?orderCode=${orderCode}&amount=${totalAmount}`;
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

    const previousStatus = order.paymentStatus;
    order.paymentStatus = status === 'success' ? 'paid' : 'failed';
    if (order.paymentStatus === 'paid') {
      order.status = 'processing';
    }
    await order.save();

    // Cộng tiền vào ví store khi đơn chuyển sang paid
    if (order.paymentStatus === 'paid' && previousStatus !== 'paid') {
      await creditStoreWallets(order);
    }

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
      const previousStatus = order.paymentStatus;
      order.paymentStatus = success ? 'paid' : 'failed';
      if (order.paymentStatus === 'paid') {
        order.status = 'processing';
      }
      await order.save();

      // Cộng tiền vào ví store khi đơn chuyển sang paid
      if (order.paymentStatus === 'paid' && previousStatus !== 'paid') {
        await creditStoreWallets(order);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// WITHDRAWAL REQUEST ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// [STORE] Lấy số dư ví của store
router.get('/wallet', protect, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    res.status(200).json({ walletBalance: wallet ? wallet.balance : 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [STORE] Tạo yêu cầu rút tiền
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountHolder } = req.body;

    if (!amount || !bankName || !accountNumber || !accountHolder) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin yêu cầu rút tiền.' });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ message: 'Số tiền rút phải lớn hơn 0.' });
    }

    // Kiểm tra số dư
    const wallet = await Wallet.findOne({ userId: req.user._id });
    const currentBalance = wallet ? wallet.balance : 0;

    if (currentBalance < Number(amount)) {
      return res.status(400).json({ message: 'Số dư ví không đủ để thực hiện yêu cầu rút tiền này.' });
    }

    // Kiểm tra xem có yêu cầu pending nào chưa
    const existingPending = await WithdrawalRequest.findOne({
      store: req.user._id,
      status: 'pending',
    });
    if (existingPending) {
      return res.status(400).json({ message: 'Bạn đang có một yêu cầu rút tiền đang chờ xử lý. Vui lòng chờ admin phê duyệt trước khi tạo yêu cầu mới.' });
    }

    const withdrawal = new WithdrawalRequest({
      store: req.user._id,
      amount: Number(amount),
      bankName,
      accountNumber,
      accountHolder,
      status: 'pending',
    });

    await withdrawal.save();

    res.status(201).json({
      message: 'Yêu cầu rút tiền đã được gửi thành công. Vui lòng chờ admin xét duyệt.',
      data: withdrawal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [STORE] Xem lịch sử yêu cầu rút tiền của store
router.get('/withdraw/my', protect, async (req, res) => {
  try {
    const withdrawals = await WithdrawalRequest.find({ store: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json({ data: withdrawals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [ADMIN] Xem tất cả yêu cầu rút tiền
router.get('/withdraw/admin/all', protect, isAdmin, async (req, res) => {
  try {
    const withdrawals = await WithdrawalRequest.find()
      .populate('store', 'fullName email companyName')
      .sort({ createdAt: -1 });

    // Enrich each withdrawal with the store's actual wallet balance
    const enriched = await Promise.all(
      withdrawals.map(async (w) => {
        const obj = w.toObject();
        if (obj.store?._id) {
          const wallet = await Wallet.findOne({ userId: obj.store._id });
          obj.store.walletBalance = wallet ? wallet.balance : 0;
        }
        return obj;
      })
    );

    res.status(200).json({ data: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [ADMIN] Duyệt hoặc từ chối yêu cầu rút tiền
router.put('/withdraw/admin/:id', protect, isAdmin, async (req, res) => {
  try {
    const { action, note } = req.body; // action: 'accept' | 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action phải là "accept" hoặc "reject".' });
    }

    const withdrawal = await WithdrawalRequest.findById(req.params.id).populate('store');
    if (!withdrawal) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu rút tiền.' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu này đã được xử lý trước đó.' });
    }

    if (action === 'accept') {
      // Trừ số dư ví của store từ Wallet collection
      const storeWallet = await Wallet.findOne({ userId: withdrawal.store._id });
      const currentBalance = storeWallet ? storeWallet.balance : 0;

      if (currentBalance < withdrawal.amount) {
        return res.status(400).json({ message: 'Số dư ví của store không đủ để thực hiện giao dịch này.' });
      }

      if (storeWallet) {
        storeWallet.balance = currentBalance - withdrawal.amount;
        await storeWallet.save();
      }

      withdrawal.status = 'accepted';
    } else {
      withdrawal.status = 'rejected';
      withdrawal.note = note || '';
    }

    withdrawal.resolvedAt = new Date();
    withdrawal.resolvedBy = req.user._id;
    await withdrawal.save();

    res.status(200).json({
      message: `Yêu cầu rút tiền đã được ${action === 'accept' ? 'chấp nhận' : 'từ chối'} thành công.`,
      data: withdrawal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
