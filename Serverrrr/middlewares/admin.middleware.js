// middlewares/admin.middleware.js

import { verifyToken } from "../utils/jwt.js";
import Admin from "../models/admin.model.js";

export const adminAuth = async (req, res, next) => {
  try {
    let token;

    // Extract token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token"
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Fetch admin (important for safety)
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found"
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account inactive"
      });
    }

    // Attach admin to request
    req.admin = admin;

    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid token"
    });
  }
};