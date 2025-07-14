import { Router, Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { authenticateToken, AuthRequest } from "../middlewares/auth";

// Configure Cloudinary directly here as a fallback
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// Upload single image
router.post(
  "/image",
  authenticateToken,
  upload.single("image"),
  async (req: AuthRequest, res: Response) => {
    try {
      // Debug environment variables
      console.log("Environment check:");
      console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
      console.log(
        "CLOUDINARY_API_KEY:",
        process.env.CLOUDINARY_API_KEY ? "Present" : "Missing"
      );
      console.log(
        "CLOUDINARY_API_SECRET:",
        process.env.CLOUDINARY_API_SECRET ? "Present" : "Missing"
      );

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate Cloudinary configuration before upload
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        return res.status(500).json({
          message: "Cloudinary configuration is incomplete",
          details: "Please check your environment variables",
        });
      }

      const uploadPromise = new Promise((resolve, reject) => {
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
              console.error("Cloudinary upload error:", error);
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
        streamifier.createReadStream(req.file!.buffer).pipe(stream);
      });

      const result = await uploadPromise;
      return res.json(result);
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Upload multiple images
router.post(
  "/images",
  authenticateToken,
  upload.array("images", 10),
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Validate Cloudinary configuration before upload
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        return res.status(500).json({
          message: "Cloudinary configuration is incomplete",
          details: "Please check your environment variables",
        });
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
                console.error("Cloudinary upload error:", error);
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
      return res.json({ images: results });
    } catch (error) {
      console.error("Multiple upload error:", error);
      return res.status(500).json({
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Delete image from Cloudinary
router.delete(
  "/image/:public_id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { public_id } = req.params;

      const result = await cloudinary.uploader.destroy(public_id);

      if (result.result === "ok") {
        res.json({ message: "Image deleted successfully" });
      } else {
        res.status(400).json({ message: "Failed to delete image" });
      }
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
