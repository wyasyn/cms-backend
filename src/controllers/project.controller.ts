import { AuthRequest } from "../middlewares/auth";
import Project from "../models/Project";
import { Request, Response } from "express";

export const getAllProjects = async (req: Request, res: Response) => {
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
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      status: "published",
    }).populate("createdBy", "username profile");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllProjectsAdmin = async (req: AuthRequest, res: Response) => {
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
};

export const createProject = async (req: AuthRequest, res: Response) => {
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
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "username profile");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json({ message: "Project deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
