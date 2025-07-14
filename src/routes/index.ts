import { Router } from "express";
import authRoutes from "./auth";
import contentRoutes from "./content";
import uploadRoutes from "./upload";
import projectRoutes from "./project";
import blogRoutes from "./blog";
import userRoutes from "./user";
import servicesRoutes from "./services";
import skillsRoutes from "./skills";
import pricingRoutes from "./pricing";

const router = Router();

router.use("/auth", authRoutes);
router.use("/content", contentRoutes);
router.use("/upload", uploadRoutes);
router.use("/projects", projectRoutes);
router.use("/blog", blogRoutes);
router.use("/users", userRoutes);
router.use("/services", servicesRoutes);
router.use("/skills", skillsRoutes);
router.use("/pricing", pricingRoutes);

export default router;
