import express from 'express';
import Cart from '../models/Cart.js';
import Item from '../models/Item.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Lấy thông tin giỏ hàng của người dùng hiện tại
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.item',
        populate: {
          path: 'owner',
          select: 'fullName companyName businessType',
        },
      });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }

    res.status(200).json({
      message: 'Cart retrieved successfully',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Thêm sản phẩm vào giỏ hàng
router.post('/add', protect, async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Tìm xem sản phẩm đã có trong giỏ hàng chưa
    const existingIndex = cart.items.findIndex(
      (p) => p.item.toString() === itemId
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += qty;
    } else {
      cart.items.push({ item: itemId, quantity: qty });
    }

    await cart.save();
    res.status(200).json({
      message: 'Item added to cart successfully',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cập nhật số lượng sản phẩm
router.post('/update', protect, async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const qty = parseInt(quantity);

    if (!itemId || isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: 'Valid Item ID and quantity >= 1 are required' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (p) => p.item.toString() === itemId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = qty;
      await cart.save();
      return res.status(200).json({
        message: 'Cart updated successfully',
        data: cart,
      });
    } else {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.post('/remove', protect, async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter((p) => p.item.toString() !== itemId);
    await cart.save();

    res.status(200).json({
      message: 'Item removed from cart successfully',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
