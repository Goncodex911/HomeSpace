import User from "../models/User.js";
import {
    hashPassword,
    comparePassword
} from "../utils/hashPassword.js";

import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";



class AuthService {
  async findUserByEmail(email) {
    return User.findOne({ email });
  }

  async findUserById(id) {
    return User.findById(id);
  }
  async register({
    username,
    email,
    password,
  }) {
    const existingUser =
      await User.findOne({
        email,
      });

    if (existingUser) {
      throw new Error(
        "Email already exists"
      );
    }

    const hashedPassword =
      await hashPassword(password);

const user = await User.create({
  username: username,
  fullName: username,
  email,
  password: hashedPassword,
  provider: "local",
});

    const accessToken =
      generateAccessToken(user);

    const refreshToken =
      generateRefreshToken(user);

    user.refreshToken =
      refreshToken;

    await user.save();

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
  async login(email, password) {
    const user =
      await User.findOne({
        email,
      });

    if (!user) {
      throw new Error(
        "Invalid email or password"
      );
    }

    if (
      user.provider === "google"
    ) {
      throw new Error(
        "Please login with Google"
      );
    }

    const isMatch =
      await comparePassword(
        password,
        user.password
      );

    if (!isMatch) {
      throw new Error(
        "Invalid email or password"
      );
    }

    user.lastLogin = new Date();

    const accessToken =
      generateAccessToken(user);

    const refreshToken =
      generateRefreshToken(user);

    user.refreshToken =
      refreshToken;

    await user.save();

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async firebaseLogin(
    decodedToken
  ) {
    const {
      uid,
      email,
      name,
      picture,
    } = decodedToken;

    let user =
      await User.findOne({
        email,
      });

    if (!user) {
      user =
        await User.create({
          username:
            name ||
            email.split("@")[0],

          fullName:
            name || "",

          email,

          avatar:
            picture || "",

          provider:
            "google",

          firebaseUid:
            uid,
        });
    }

    user.lastLogin = new Date();

    const accessToken =
      generateAccessToken(user);

    const refreshToken =
      generateRefreshToken(user);

    user.refreshToken =
      refreshToken;

    await user.save();

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
  async saveRefreshToken(
    userId,
    refreshToken
  ) {
    await User.findByIdAndUpdate(
      userId,
      {
        refreshToken,
      }
    );
  }

  async logout(userId) {
    await User.findByIdAndUpdate(
      userId,
      {
        refreshToken: null,
      }
    );

    return true;
  }

  async getProfile(userId) {
    return User.findById(userId).select(
      "-password -refreshToken"
    );
  }

  async updateProfile(
    userId,
    updateData
  ) {
    delete updateData.password;
    delete updateData.role;
    delete updateData.provider;
    delete updateData.firebaseUid;

    return User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
      }
    ).select(
      "-password -refreshToken"
    );
  }

  async changePassword(
    userId,
    oldPassword,
    newPassword
  ) {
    const user =
      await User.findById(
        userId
      );

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    if (
      user.provider === "google"
    ) {
      throw new Error(
        "Google account cannot change password"
      );
    }

    const isMatch =
      await comparePassword(
        oldPassword,
        user.password
      );

    if (!isMatch) {
      throw new Error(
        "Old password incorrect"
      );
    }

    user.password =
      await hashPassword(
        newPassword
      );

    await user.save();

    return true;
  }
}

export default new AuthService();