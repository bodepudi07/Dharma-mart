// services/auth.service.js

import Admin from "../models/admin.model.js";

export const loginAdmin = async (email, password) => {
  const admin = await Admin.findOne({ email }).select("+password");

  if (!admin) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await admin.comparePassword(password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return admin;
};