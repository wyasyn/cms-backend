import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import cloudinary from "../utils/cloudinary";
import streamifier from "streamifier";

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadToCloudinary = (): Promise<{
      url: string;
      public_id: string;
      width: number;
      height: number;
    }> => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "portfolio",
            transformation: [
              { width: 1200, height: 800, crop: "limit" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error || !result) {
              console.error("Cloudinary upload error:", error);
              return reject(error || new Error("Unknown upload error"));
            }

            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
            });
          }
        );

        streamifier.createReadStream(req.file!.buffer).pipe(uploadStream);
      });
    };

    const result = await uploadToCloudinary();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Image upload failed:", error);
    return res.status(500).json({
      message: "Image upload failed",
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

export const uploadMultipleImages = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadImage = (
      file: Express.Multer.File
    ): Promise<{
      url: string;
      public_id: string;
      width: number;
      height: number;
    }> => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "portfolio",
            transformation: [
              { width: 1200, height: 800, crop: "limit" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error || !result) {
              console.error("Cloudinary upload error:", error);
              return reject(error || new Error("Unknown upload error"));
            }

            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
            });
          }
        );

        streamifier.createReadStream(file.buffer).pipe(stream);
      });
    };

    const uploadResults = await Promise.all(files.map(uploadImage));

    return res.status(200).json({ images: uploadResults });
  } catch (error) {
    console.error("Multiple upload error:", error);
    return res.status(500).json({
      message: "Image upload failed",
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

export const deleteImage = async (req: AuthRequest, res: Response) => {
  try {
    const { public_id } = req.params;

    if (!public_id || typeof public_id !== "string") {
      return res.status(400).json({ message: "Invalid or missing public_id" });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === "ok") {
      return res.status(200).json({ message: "Image deleted successfully" });
    } else if (result.result === "not found") {
      return res.status(404).json({ message: "Image not found" });
    } else {
      console.warn("Unexpected delete result:", result);
      return res
        .status(400)
        .json({ message: "Failed to delete image", result });
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return res.status(500).json({
      message: "Server error while deleting image",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
