import express from 'express';
import User from '../models/User.js';
import Item from '../models/Item.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// @route   GET /api/favorites/ids
// @desc    Get favorite product IDs for quick UI checks
router.get('/ids', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('favorites');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ ids: (user.favorites || []).map((id) => id.toString()) });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch favorites' });
  }
});

// @route   GET /api/favorites
// @desc    Get favorite products with details
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      match: { _id: { $exists: true } },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const items = (user.favorites || []).filter(Boolean);
    res.json({ data: items, count: items.length });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch favorites' });
  }
});

// @route   POST /api/favorites/:itemId
// @desc    Add product to favorites
router.post('/:itemId', protect, async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyFavorite = user.favorites.some((id) => id.toString() === itemId);
    if (alreadyFavorite) {
      return res.status(200).json({
        message: 'Product already in favorites',
        ids: user.favorites.map((id) => id.toString()),
      });
    }

    user.favorites.push(itemId);
    await user.save();

    res.status(201).json({
      message: 'Added to favorites',
      ids: user.favorites.map((id) => id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to add favorite' });
  }
});

// @route   DELETE /api/favorites/:itemId
// @desc    Remove product from favorites
router.delete('/:itemId', protect, async (req, res) => {
  try {
    const { itemId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.favorites = user.favorites.filter((id) => id.toString() !== itemId);
    await user.save();

    res.json({
      message: 'Removed from favorites',
      ids: user.favorites.map((id) => id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to remove favorite' });
  }
});

export default router;
