import admin from "../firebase/firebaseAdmin.js";
import jwt from "jsonwebtoken";
import authService from "../services/authService.js";

export const register = async (req, res) => {
  try {
    console.log(req.body);
    const { username, email, password } =
      req.body;

    const result =
      await authService.register({
        username,
        email,
        password,
      });

    return res.status(201).json({
      success: true,
      message:
        "Register successfully",
      accessToken:
        result.accessToken,
      refreshToken:
        result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (
  req,
  res
) => {
  try {
    const { email, password } =
      req.body;

    const result =
      await authService.login(
        email,
        password
      );

    return res.status(200).json({
      success: true,
      message:
        "Login successfully",
      accessToken:
        result.accessToken,
      refreshToken:
        result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const firebaseLogin =
  async (req, res) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message:
            "Firebase token is required",
        });
      }

      const decodedToken =
        await admin
          .auth()
          .verifyIdToken(idToken);

      const result =
        await authService.firebaseLogin(
          decodedToken
        );

      return res.status(200).json({
        success: true,
        message:
          "Google login successfully",
        accessToken:
          result.accessToken,
        refreshToken:
          result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid Firebase token",
      });
    }
  };

export const refreshToken =
  async (req, res) => {
    try {
      const { refreshToken } =
        req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message:
            "Refresh token is required",
        });
      }

      const decoded = jwt.verify(
        refreshToken,
        process.env
          .JWT_REFRESH_SECRET
      );

      const user =
        await authService.findUserById(
          decoded.id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      if (
        user.refreshToken !==
        refreshToken
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid refresh token",
        });
      }

      const accessToken =
        jwt.sign(
          {
            id: user._id,
            email: user.email,
            role: user.role,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );

      return res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          "Refresh token expired",
      });
    }
  };

export const logout = async (
  req,
  res
) => {
  try {
    await authService.logout(
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message:
        "Logout successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProfile =
  async (req, res) => {
    try {
      const user =
        await authService.getProfile(
          req.user._id
        );

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

export const updateProfile =
  async (req, res) => {
    try {
      const updatedUser =
        await authService.updateProfile(
          req.user._id,
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

export const changePassword =
  async (req, res) => {
    try {
      const {
        oldPassword,
        newPassword,
      } = req.body;

      await authService.changePassword(
        req.user._id,
        oldPassword,
        newPassword
      );

      return res.status(200).json({
        success: true,
        message:
          "Password changed successfully",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

export default {
  register,
  login,
  firebaseLogin,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
};