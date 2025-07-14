import { Request, Response } from "express";
import Blog from "../models/Blog";
import { AuthRequest } from "../middlewares/auth";

// GET / - Get published blogs with optional filters
export const getPublishedBlogs = async (req: Request, res: Response) => {
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
};

// GET /post/:slug - Get a single published blog post by slug
export const getPostBySlug = async (req: Request, res: Response) => {
  try {
    const post = await Blog.findOne({
      slug: req.params.slug,
      status: "published",
    }).populate("author", "username profile");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /admin/all - Get all blog posts for admin/editor
export const getAllBlogsForAdmin = async (req: AuthRequest, res: Response) => {
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
};

// POST / - Create a new blog post
export const createBlogPost = async (req: AuthRequest, res: Response) => {
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
};

// PUT /:id - Update blog post
export const updateBlogPost = async (req: AuthRequest, res: Response) => {
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

    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /:id - Delete blog post
export const deleteBlogPost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await Blog.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.json({ message: "Post deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
