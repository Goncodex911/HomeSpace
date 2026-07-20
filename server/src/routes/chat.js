import express from 'express';
import Item from '../models/Item.js';
import { generateChatReply } from '../utils/gemini.js';

const router = express.Router();

const mapSuggestedProduct = (product) => ({
  _id: product._id,
  name: product.name,
  price: product.price,
  category: product.category,
  image: product.image,
  averageRating: product.averageRating,
  storeName: product.owner?.companyName || product.owner?.fullName || 'Lumina Store',
});

router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const products = await Item.find({ quantity: { $gt: 0 } })
      .select('name description price category image averageRating quantity owner')
      .populate('owner', 'fullName companyName')
      .lean();

    const validIds = new Set(products.map((product) => product._id.toString()));
    const { reply, productIds } = await generateChatReply({
      message: String(message).trim(),
      history,
      products,
    });

    const suggestedProducts = productIds
      .filter((id) => validIds.has(id))
      .slice(0, 4)
      .map((id) => mapSuggestedProduct(products.find((product) => product._id.toString() === id)));

    res.status(200).json({
      reply,
      suggestedProducts,
    });
  } catch (err) {
    console.error('[CHAT ERROR]', err.message);
    res.status(500).json({
      message: err.message || 'Failed to generate chat response.',
    });
  }
});

export default router;
