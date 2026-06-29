import express from 'express';
import Order from '../models/Order.js';
import Item from '../models/Item.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import payOS from '../utils/payos.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (Customer)
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Verify items, prices, and quantities
    for (const orderItem of items) {
      const item = await Item.findById(orderItem.item);
      if (!item) {
        return res.status(404).json({ message: `Item not found: ${orderItem.item}` });
      }

      if (item.quantity < orderItem.quantity) {
        return res.status(400).json({ message: `Not enough stock for item: ${item.name}` });
      }

      const price = item.price;
      const quantity = orderItem.quantity;
      const store = item.owner;

      orderItems.push({
        item: item._id,
        quantity,
        price,
        store
      });

      totalAmount += price * quantity;

      // Deduct stock without triggering validation for legacy missing fields
      await Item.updateOne(
        { _id: item._id },
        { $inc: { quantity: -quantity } }
      );
    }

    // Tạo mã đơn hàng độc nhất dưới dạng số nguyên (Yêu cầu bắt buộc của PayOS)
    const orderCode = Number(String(Date.now()).slice(-9)) + Math.floor(Math.random() * 1000);

    const order = new Order({
      customer: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      orderCode,
      paymentStatus: 'pending',
    });

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
          name: 'Atelier Product', // default name for PayOS item list
          quantity: i.quantity,
          price: i.price,
        })),
        returnUrl: `${returnUrl}&orderCode=${orderCode}`,
        cancelUrl: `${cancelUrl}&orderCode=${orderCode}`,
      };

      const paymentResponse = await payOS.paymentRequests.create(paymentData);
      checkoutUrl = paymentResponse.checkoutUrl;
      order.paymentLinkId = paymentResponse.paymentLinkId;
    } else {
      // Chế độ Giả lập (Mock) gửi link tới màn hình thanh toán giả lập trên frontend
      checkoutUrl = `https://localhost:5173/mock-payment?orderCode=${orderCode}&amount=${totalAmount}`;
      console.log(`[Mock Checkout Url]: ${checkoutUrl}`);
    }

    const createdOrder = await order.save();

    // Clear cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(201).json({
      ...createdOrder.toObject(),
      checkoutUrl,
      orderCode
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error while creating order', error: error.message });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders (Customer) or store's orders (Store)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userRole = req.user.role;
    let orders;

    if (userRole === 'admin') {
      orders = await Order.find({}).populate('customer', 'fullName email').populate('items.item', 'name');
    } else if (userRole === 'store') {
      // Find orders that contain items from this store
      orders = await Order.find({ 'items.store': req.user._id })
        .populate('customer', 'fullName email')
        .populate('items.item', 'name');
      
      // Filter out items not belonging to the store in the response (optional but good for privacy)
      // For MVP we just return the full order
    } else {
      // Customer
      orders = await Order.find({ customer: req.user._id }).populate('items.item', 'name');
    }

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'fullName email')
      .populate('items.item', 'name price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Access control: only admin, the customer who placed it, or a store involved in the order can view it
    const isCustomer = order.customer?._id?.toString() === req.user._id.toString();
    const isStore = order.items.some(item => item.store?.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isStore && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching order details' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Store / Admin)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isStore = order.items.some(item => item.store?.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isStore && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating order status' });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private (Customer)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason, details } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.status !== 'pending' && order.status !== 'processing') {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason || 'Not specified';
    order.cancellationDetails = details || '';
    
    // Restore stock
    for (const orderItem of order.items) {
      await Item.updateOne(
        { _id: orderItem.item },
        { $inc: { quantity: orderItem.quantity } }
      );
    }

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ message: 'Server error while cancelling order' });
  }
});

// @route   PUT /api/orders/:id/return
// @desc    Submit a return request for an order
// @access  Private (Customer)
router.put('/:id/return', protect, async (req, res) => {
  try {
    const { reason, comments, method, itemsToReturn } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to return this order' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be returned' });
    }

    if (order.returnRequest?.isRequested) {
      return res.status(400).json({ message: 'A return request has already been submitted for this order' });
    }

    order.returnRequest = {
      isRequested: true,
      reason,
      comments,
      method,
      itemsToReturn,
      status: 'pending'
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error('Order return error:', error);
    res.status(500).json({ message: 'Server error while submitting return request' });
  }
});

export default router;
