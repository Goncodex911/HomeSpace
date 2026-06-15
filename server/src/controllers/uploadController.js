import {
  uploadImage,
} from "../services/cloudinaryService.js";

export const uploadSingleImage =
  async (req, res) => {
    try {
      const result =
        await uploadImage(
          req.file.buffer
        );

      return res.json({
        success: true,
        publicId:
          result.public_id,
        imageUrl:
          result.secure_url,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };