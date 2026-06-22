import { Router } from "express";
import { authenticate, canDelete, canEdit, canUpload } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import {
  contentRules,
  contentUpdateRules,
  createContent,
  dashboardStats,
  deleteContent,
  getContent,
  idRules,
  listContent,
  typeRules,
  updateContent
} from "../controllers/content.controller.js";

const router = Router();

router.get("/dashboard/stats", authenticate, dashboardStats);
router.get("/:type", typeRules, validate, listContent);
router.get("/:type/:id", idRules, validate, getContent);
router.post("/:type", authenticate, canUpload, typeRules, contentRules, validate, createContent);
router.put("/:type/:id", authenticate, canEdit, idRules, contentUpdateRules, validate, updateContent);
router.delete("/:type/:id", authenticate, canDelete, idRules, validate, deleteContent);

export default router;
