import { Request, Response } from "express";
import Content from "../models/Content";
import { AuthRequest } from "../middlewares/auth";

// Public: Get content for a specific page
export const getPageContent = async (req: Request, res: Response) => {
  try {
    const content = await Content.findOne({
      page: req.params.page,
      isPublished: true,
    }).populate("lastEditedBy", "username");

    if (!content) {
      return res.status(404).json({ message: "Page not found" });
    }

    return res.json(content);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin/Editor: Get all pages
export const getAllPages = async (req: AuthRequest, res: Response) => {
  try {
    const contents = await Content.find({})
      .populate("lastEditedBy", "username")
      .sort({ updatedAt: -1 });

    res.json(contents);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin/Editor: Update or create page content
export const updatePageContent = async (req: AuthRequest, res: Response) => {
  try {
    const { data, seo, isPublished } = req.body;

    const content = await Content.findOneAndUpdate(
      { page: req.params.page },
      {
        data,
        seo,
        isPublished,
        lastEditedBy: req.user!._id,
      },
      { upsert: true, new: true, runValidators: true }
    ).populate("lastEditedBy", "username");

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
