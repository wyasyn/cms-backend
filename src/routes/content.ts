import { Router } from "express";
import Content from "../models/Content";
import { authenticateToken, AuthRequest } from "../middlewares/auth";

const router = Router();

// Get page content (public)
router.get("/:page", async (req, res) => {
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
});

// Get all pages (admin/editor)
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const contents = await Content.find({})
      .populate("lastEditedBy", "username")
      .sort({ updatedAt: -1 });

    res.json(contents);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update page content (admin/editor)
router.put("/:page", authenticateToken, async (req: AuthRequest, res) => {
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
});

export default router;
