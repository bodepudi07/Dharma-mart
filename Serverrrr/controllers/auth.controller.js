// controllers/auth.controller.js

import { loginAdmin } from "../services/auth.service.js";
import { signToken } from "../utils/jwt.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const admin = await loginAdmin(email, password);

    const token = signToken({
      id: admin._id,
      role: admin.role
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        admin
      }
    });

  } catch (err) {
    res.status(401).json({
      success: false,
      message: err.message
    });
  }
};