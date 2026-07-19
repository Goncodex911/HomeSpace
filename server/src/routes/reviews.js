import express from 'express';
import Review from '../models/Review.js';
import Item from '../models/Item.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// @desc    Add review for a product
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: 'Missing product ID, rating, or comment' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const item = await Item.findById(productId);
    if (!item) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user already reviewed this product
    const existingReview = await Review.findOne({ product: productId, user: req.user._id });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = new Review({
      product: productId,
      user: req.user._id,
      rating: Number(rating),
      comment: comment,
    });

    await review.save();

    res.status(201).json({
      message: 'Review added successfully',
      data: review,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Reviews retrieved successfully',
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
