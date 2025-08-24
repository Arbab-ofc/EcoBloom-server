import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: process.env.CLOUDINARY_FOLDER || "uploads",
      resource_type: "image",
      format: undefined, 
      public_id: undefined, 
    };
  },
});

function fileFilter(req, file, cb) {
  const ok = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(
    file.mimetype
  );
  cb(ok ? null : new Error("Only image files allowed"), ok);
}

export const uploadCloud = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});
