import { Router } from "express";
import Blog from "../models/Blog";
import { authenticateToken, AuthRequest } from "../middlewares/auth";

const router = Router();

// Get all blog posts (public - published only)
router.get("/", async (req, res) => {
  try {
    const { category, tag, page = 1, limit = 10 } = req.query;
    const filter: any = { status: "published" };

    if (category) filter.category = category;
    if (tag) filter.tags = { $in: [tag] };

    const posts = await Blog.find(filter)
      .populate("author", "username profile")
      .sort({ publishedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Blog.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get single blog post by slug (public)
router.get("/post/:slug", async (req, res) => {
  try {
    const post = await Blog.findOne({
      slug: req.params.slug,
      status: "published",
    }).populate("author", "username profile");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all blog posts for admin (admin/editor)
router.get("/admin/all", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    const posts = await Blog.find(filter)
      .populate("author", "username profile")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Blog.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create blog post (admin/editor)
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const postData = {
      ...req.body,
      author: req.user!._id,
    };

    if (postData.status === "published" && !postData.publishedAt) {
      postData.publishedAt = new Date();
    }

    const post = new Blog(postData);
    await post.save();

    const populatedPost = await Blog.findById(post._id).populate(
      "author",
      "username profile"
    );

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update blog post (admin/editor)
router.put("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.status === "published" && !updateData.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const post = await Blog.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("author", "username profile");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete blog post (admin/editor)
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const post = await Blog.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
