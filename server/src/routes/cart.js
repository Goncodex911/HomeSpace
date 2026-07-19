import express from 'express';
import Cart from '../models/Cart.js';
import Item from '../models/Item.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

const cleanAndPopulateCart = async (cart) => {
  await cart.populate('items.item');
  const originalLength = cart.items.length;
  cart.items = cart.items.filter(itemGroup => itemGroup.item !== null);
  if (cart.items.length !== originalLength) {
    await cart.save();
  }
  return cart;
};

// @route   GET /api/cart
// @desc    Get current user's cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    cart = await cleanAndPopulateCart(cart);
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching cart' });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart or update quantity
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(p => p.item.toString() === itemId);

    if (itemIndex > -1) {
      // Item exists in cart, update quantity
      cart.items[itemIndex].quantity += quantity || 1;
    } else {
      // Item does not exist in cart, add it
      cart.items.push({ item: itemId, quantity: quantity || 1 });
    }

    await cart.save();
    
    // Return populated cart
    cart = await cleanAndPopulateCart(cart);
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while adding to cart' });
  }
});
// @route   PUT /api/cart/:itemId
// @desc    Update exact quantity of an item in cart
// @access  Private
router.put('/:itemId', protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(p => p.item.toString() === req.params.itemId);

    if (itemIndex > -1) {
      if (quantity > 0) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        cart.items.splice(itemIndex, 1);
      }
      await cart.save();
    }
    cart = await cleanAndPopulateCart(cart);
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating cart item' });
  }
});


// @route   DELETE /api/cart/:itemId
// @desc    Remove an item from cart
// @access  Private
router.delete('/:itemId', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(p => p.item.toString() !== req.params.itemId);
    await cart.save();

    cart = await cleanAndPopulateCart(cart);
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while removing from cart' });
  }
});

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while clearing cart' });
  }
});

export default router;
