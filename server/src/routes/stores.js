import express from 'express';
import User from '../models/User.js';
import Item from '../models/Item.js';

const router = express.Router();

// @route   GET /api/stores
// @desc    Get all approved stores (vendors with role='store')
// @access  Public
router.get('/', async (req, res) => {
  try {
    const stores = await User.find({ role: 'store', vendorStatus: 'approved' })
      .select('fullName companyName businessType philosophy city state yearsInIndustry createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Stores retrieved successfully',
      data: stores,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/stores/:id
// @desc    Get store profile by ID (public info + their items)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const store = await User.findOne({ _id: req.params.id, role: 'store' })
      .select('fullName companyName businessType philosophy city state yearsInIndustry createdAt phone email');

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Get all items belonging to this store
    const items = await Item.find({ owner: req.params.id }).sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Store profile retrieved successfully',
      data: {
        store,
        items,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
