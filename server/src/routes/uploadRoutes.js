import express from "express";

import upload from "../middlewares/uploadMiddleware.js";

import {
  uploadSingleImage,
} from "../controllers/uploadController.js";

const router =
  express.Router();

router.post(
  "/single",
  upload.single("image"),
  uploadSingleImage
);

export default router;