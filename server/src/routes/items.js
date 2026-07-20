import express from 'express';
import Item from '../models/Item.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roleAuth.js';

const router = express.Router();

// Thêm item mới - Chỉ dành cho store và admin
router.post('/add', protect, authorize(['store', 'admin']), async (req, res) => {
  try {
    const { name, description, quantity, price, category, image, model3d } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newItem = new Item({
      name,
      description,
      quantity,
      price,
      category: category || 'Uncategorized',
      owner: req.user._id,
      image: image || '',
      model3d: model3d || '',
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
    const items = await Item.find().populate('owner', 'fullName companyName');
    res.status(200).json({
      message: 'Items retrieved successfully',
      data: items,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lấy items của curator đang đăng nhập - Chỉ trả về sản phẩm của chính mình
router.get('/my', protect, authorize(['store', 'admin']), async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      message: 'Your items retrieved successfully',
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

// Cập nhật item - Chỉ dành cho store (chủ sở hữu) và admin
router.put('/update/:id', protect, authorize(['store', 'admin']), async (req, res) => {
  try {
    const { name, description, quantity, price, category, image, model3d } = req.body;

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Chỉ chủ sở hữu hoặc admin mới được cập nhật
    if (req.user.role !== 'admin' && item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own products' });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { name, description, quantity, price, category, image, model3d },
      { new: true }
    );

    res.status(200).json({
      message: 'Item updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Xóa item - Chỉ dành cho store (chủ sở hữu) và admin
router.delete('/delete/:id', protect, authorize(['store', 'admin']), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Chỉ chủ sở hữu hoặc admin mới được xóa
    if (req.user.role !== 'admin' && item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own products' });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Item deleted successfully',
      data: item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- CLOUDINARY UPLOAD & TRIPO3D IMAGE-TO-3D CONFIGS ---
import multer from 'multer';
import axios from 'axios';
import cloudinary from '../utils/cloudinary.js';
import fs from 'fs';

// Cấu hình Multer để lưu file tạm thời trên đĩa cứng
const upload = multer({ dest: 'uploads/' });

// @route   POST /api/items/upload-image
// @desc    Upload ảnh sản phẩm lên Cloudinary
// @access  Private (Store/Admin)
router.post('/upload-image', protect, authorize(['store', 'admin']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload lên Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'homespace_products',
    });

    // Xóa file tạm sau khi upload thành công
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: 'Upload image successfully',
      imageUrl: result.secure_url,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload Error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload image' });
  }
});

// @route   POST /api/items/generate-3d/:id
// @desc    Gửi ảnh của sản phẩm sang Tripo3D AI để chuyển đổi thành mô hình 3D (.glb)
// @access  Private (Store/Admin)
router.post('/generate-3d/:id', protect, authorize(['store', 'admin']), async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const apiKey = process.env.TRIPO_3D_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ message: 'TRIPO_3D_API_KEY is missing on server env.' });
    }

    // --- LUỒNG THẬT SỬ DỤNG TRIPO3D API ---
    // Bước 1: Gửi yêu cầu chuyển đổi ảnh (Image to Model Task)
    const taskResponse = await axios.post(
      'https://api.tripo3d.ai/v2/openapi/task',
      {
        type: 'image_to_model',
        file: {
          type: 'jpg', // định dạng ảnh tương ứng
          url: imageUrl // Tripo nhận URL ảnh trực tiếp từ Cloudinary
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    const taskId = taskResponse.data?.data?.task_id;
    if (!taskId) {
      return res.status(500).json({ message: 'Failed to create 3D task on Tripo3D.' });
    }

    // Bước 2: Polling kiểm tra trạng thái Task cho tới khi hoàn thành (Success)
    let isCompleted = false;
    let model3dUrl = '';
    let retryCount = 0;
    const maxRetries = 60; // Tăng lên tối đa 5 phút (60 lần thử, mỗi lần cách nhau 5 giây)

    console.log(`[Tripo3D] Bắt đầu polling task ID: ${taskId}`);

    while (!isCompleted && retryCount < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      retryCount++;

      const statusResponse = await axios.get(
        `https://api.tripo3d.ai/v2/openapi/task/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      const task = statusResponse.data?.data;
      console.log(`[Tripo3D] Polling lần ${retryCount}: Trạng thái = ${task.status}, Tiến độ = ${task.progress || 0}%`);

      if (task.status === 'success') {
        isCompleted = true;
        // Tripo v2.5 trả về link GLB trong result.pbr_model.url hoặc output.pbr_model
        model3dUrl = task.result?.pbr_model?.url || task.output?.pbr_model || task.output?.model_url || task.output?.model?.glb;
        console.log(`[Tripo3D] Tạo thành công! Link GLB: ${model3dUrl}`);
        break;
      } else if (task.status === 'failed') {
        console.error(`[Tripo3D] Task bị thất bại từ phía server Tripo3D.`);
        return res.status(500).json({ message: 'Tripo3D generation task failed.' });
      }
    }

    if (!model3dUrl) {
      return res.status(508).json({ message: 'Task timeout: AI took too long to generate the 3D model.' });
    }

    // Lưu thông tin vào Database
    item.image = imageUrl;
    item.model3d = model3dUrl;
    await item.save();

    res.status(200).json({
      message: '3D model generated and saved successfully',
      model3d: model3dUrl,
      data: item
    });

  } catch (error) {
    console.error('Tripo3D Error:', error.response?.data || error.message);
    res.status(500).json({ message: error.response?.data?.message || error.message });
  }
});

// @route   POST /api/items/tripo-sync/:id
// @desc    Lấy lại (đồng bộ) file 3D từ một Task ID cũ đã tạo thành công trên Tripo3D
// @access  Private (Store/Admin)
router.post('/tripo-sync/:id', protect, authorize(['store', 'admin']), async (req, res) => {
  try {
    const { taskId } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    const apiKey = process.env.TRIPO_3D_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ message: 'TRIPO_3D_API_KEY is not configured on server' });
    }

    console.log(`[Tripo3D] Đang đồng bộ thông tin của Task ID: ${taskId}`);

    const statusResponse = await axios.get(
      `https://api.tripo3d.ai/v2/openapi/task/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    const task = statusResponse.data?.data;
    if (!task) {
      return res.status(404).json({ message: 'Task not found on Tripo3D server' });
    }

    if (task.status !== 'success') {
      return res.status(400).json({ 
        message: `Task is not ready. Current status: ${task.status}. Progress: ${task.progress || 0}%` 
      });
    }

    const model3dUrl = task.result?.pbr_model?.url || task.output?.pbr_model || task.output?.model_url || task.output?.model?.glb;
    if (!model3dUrl) {
      return res.status(404).json({ message: 'No GLB URL found in this task output' });
    }

    // Cập nhật model3d cho sản phẩm
    item.model3d = model3dUrl;
    await item.save();

    res.status(200).json({
      message: '3D model synchronized successfully from previous task!',
      model3d: model3dUrl,
      data: item
    });

  } catch (error) {
    console.error('Tripo3D Sync Error:', error.response?.data || error.message);
    res.status(500).json({ message: error.response?.data?.message || error.message });
  }
});

export default router;
