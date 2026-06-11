import express from 'express';
import Item from '../models/Item.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roleAuth.js';

const router = express.Router();

// Thêm item mới - Chỉ dành cho store và admin
router.post('/add', protect, authorize(['store', 'admin']), async (req, res) => {
  try {
    const { name, description, quantity, price } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newItem = new Item({
      name,
      description,
      quantity,
      price,
    });

    await newItem.save();
    res.status(201).json({
      message: 'Item added successfully',
      data: newItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lấy tất cả items - Công khai cho khách hàng xem
router.get('/all', async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json({
      message: 'Items retrieved successfully',
      data: items,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lấy item theo ID - Công khai
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json({
      message: 'Item retrieved successfully',
      data: item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cập nhật item - Chỉ dành cho store và admin
router.put('/update/:id', protect, authorize(['store', 'admin']), async (req, res) => {
  try {
    const { name, description, quantity, price } = req.body;

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { name, description, quantity, price },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({
      message: 'Item updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Xóa item - Chỉ dành cho store và admin
router.delete('/delete/:id', protect, authorize(['store', 'admin']), async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({
      message: 'Item deleted successfully',
      data: deletedItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
