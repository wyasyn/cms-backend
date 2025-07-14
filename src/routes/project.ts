import { Router } from "express";
import Project from "../models/Project";
import { authenticateToken, AuthRequest } from "../middlewares/auth";

const router = Router();

// Get all projects (public - published only)
router.get("/", async (req, res) => {
  try {
    const { category, featured, page = 1, limit = 10 } = req.query;
    const filter: any = { status: "published" };

    if (category) filter.category = category;
    if (featured === "true") filter.featured = true;

    const projects = await Project.find(filter)
      .populate("createdBy", "username profile")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Project.countDocuments(filter);

    res.json({
      projects,
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

// Get single project (public)
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      status: "published",
    }).populate("createdBy", "username profile");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all projects for admin (admin/editor)
router.get("/admin/all", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    const projects = await Project.find(filter)
      .populate("createdBy", "username profile")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Project.countDocuments(filter);

    res.json({
      projects,
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

// Create project (admin/editor)
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const projectData = {
      ...req.body,
      createdBy: req.user!._id,
    };

    const project = new Project(projectData);
    await project.save();

    const populatedProject = await Project.findById(project._id).populate(
      "createdBy",
      "username profile"
    );

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update project (admin/editor)
router.put("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "username profile");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete project (admin/editor)
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
