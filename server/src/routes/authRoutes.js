import express from "express";
import authController from "../controllers/authController.js";
import authenticate from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  authController.register
);

router.post(
  "/login",
  authController.login
);

router.post(
  "/firebase-login",
  authController.firebaseLogin
);

router.post(
  "/refresh-token",
  authController.refreshToken
);

router.post(
  "/logout",
  authenticate,
  authController.logout
);

router.get(
  "/profile",
  authenticate,
  authController.getProfile
);

router.put(
  "/profile",
  authenticate,
  authController.updateProfile
);

router.put(
  "/change-password",
  authenticate,
  authController.changePassword
);

export default router;