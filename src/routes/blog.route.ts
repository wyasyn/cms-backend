import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import {
  getPublishedBlogs,
  getPostBySlug,
  getAllBlogsForAdmin,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "../controllers/blog.controller";

const router = Router();

// Public
router.get("/", getPublishedBlogs);
router.get("/post/:slug", getPostBySlug);

// Admin/editor
router.get("/admin/all", authenticateToken, getAllBlogsForAdmin);
router.post("/", authenticateToken, createBlogPost);
router.put("/:id", authenticateToken, updateBlogPost);
router.delete("/:id", authenticateToken, deleteBlogPost);

export default router;
