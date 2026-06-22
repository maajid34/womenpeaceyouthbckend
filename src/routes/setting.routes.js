import { Router } from "express";
import { param } from "express-validator";
import { authenticate, canDelete, canEdit } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { Setting } from "../models/Setting.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, asyncHandler(async (_req, res) => {
  const settings = await Setting.find().sort({ key: 1 });
  res.json({ settings });
}));

router.put("/:key", authenticate, canEdit, asyncHandler(async (req, res) => {
  const setting = await Setting.findOneAndUpdate(
    { key: req.params.key },
    { value: req.body.value ?? req.body, updatedBy: req.user._id },
    { new: true, upsert: true }
  );
  res.json({ setting });
}));

router.delete("/:id", authenticate, canDelete, param("id").isMongoId(), validate, asyncHandler(async (req, res) => {
  const setting = await Setting.findByIdAndDelete(req.params.id);
  if (!setting) {
    const error = new Error("Setting not found");
    error.statusCode = 404;
    throw error;
  }
  res.json({ message: "Setting deleted" });
}));

export default router;
