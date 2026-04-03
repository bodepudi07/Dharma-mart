// utils/uploadToCloudinary.js
import cloudinary from "./cloudinary.js";

export const uploadBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "products" },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          url: result.secure_url,
          public_id: result.public_id
        });
      }
    ).end(buffer);
  });
};