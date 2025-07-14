import { Router } from "express";
import multer from "multer";
import cloudinary from "../utils/cloudinary";
import streamifier from "streamifier";
import { authenticateToken } from "../middlewares/auth";

const router = Router();
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Upload single image
router.post(
  "/image",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "portfolio",
          transformation: [
            { width: 1200, height: 800, crop: "limit" },
            { quality: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary error:", error);
            return res
              .status(500)
              .json({ message: "Upload failed", error: error.message });
          }
          return res.json({
            url: result?.secure_url,
            public_id: result?.public_id,
            width: result?.width,
            height: result?.height,
          });
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Upload multiple images
router.post(
  "/images",
  authenticateToken,
  upload.array("images", 10),
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "portfolio",
              transformation: [
                { width: 1200, height: 800, crop: "limit" },
                { quality: "auto" },
              ],
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve({
                  url: result?.secure_url,
                  public_id: result?.public_id,
                  width: result?.width,
                  height: result?.height,
                });
              }
            }
          );
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
      });

      const results = await Promise.all(uploadPromises);
      res.json({ images: results });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete image from Cloudinary
router.delete("/image/:public_id", authenticateToken, async (req, res) => {
  try {
    const { public_id } = req.params;

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === "ok") {
      res.json({ message: "Image deleted successfully" });
    } else {
      res.status(400).json({ message: "Failed to delete image" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
