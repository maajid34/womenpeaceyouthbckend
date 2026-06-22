import { Router } from "express";
import { authenticate, canDelete, canUpload } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import {
  completeUpload,
  completeUploadRules,
  deleteUpload,
  deleteUploadRules,
  listMedia,
  signUpload,
  signUploadRules,
  uploadConfig
} from "../controllers/upload.controller.js";

const router = Router();

router.get("/config", uploadConfig);
router.use(authenticate);
router.get("/", listMedia);
router.post("/sign", canUpload, signUploadRules, validate, signUpload);
router.post("/complete", canUpload, completeUploadRules, validate, completeUpload);
router.delete("/:id", canDelete, deleteUploadRules, validate, deleteUpload);

export default router;
