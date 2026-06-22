import { Router } from "express";
import { dashboardStats } from "../controllers/content.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/stats", authenticate, dashboardStats);

export default router;
