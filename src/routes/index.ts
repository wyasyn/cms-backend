import { Router } from "express";
import authRoutes from "./auth.route";
import contentRoutes from "./content.route";
import uploadRoutes from "./upload.route";
import projectRoutes from "./project.route";
import blogRoutes from "./blog.route";
import userRoutes from "./user.route";
import servicesRoutes from "./services.route";
import skillsRoutes from "./skills.route";
import pricingRoutes from "./pricing.route";

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
