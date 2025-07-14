import { Router, Request, Response } from "express";
import multer from "multer";
import { authenticateToken } from "../middlewares/auth";

import {
  deleteImage,
  uploadImage,
  uploadMultipleImages,
} from "../controllers/upload.controller";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
    }
  },
});

router.use((err: any, req: Request, res: Response, next: Function) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === "Only JPEG, PNG, GIF, and WebP images are allowed") {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

// Upload single image
router.post("/image", authenticateToken, upload.single("image"), uploadImage);

// Upload multiple images
router.post(
  "/images",
  authenticateToken,
  upload.array("images", 10),
  uploadMultipleImages
);

// Delete image from Cloudinary
router.delete("/image/:public_id", authenticateToken, deleteImage);

export default router;
