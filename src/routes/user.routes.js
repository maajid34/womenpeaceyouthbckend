import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize, roles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate, authorize(roles.SUPER_ADMIN));

router.get("/", asyncHandler(async (_req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json({ users });
}));

router.post(
  "/",
  body("name").trim().notEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  body("role").isIn(["Super Admin", "Admin", "Editor"]),
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.create(req.body);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  })
);

router.put(
  "/:id",
  param("id").isMongoId(),
  body("role").optional().isIn(["Super Admin", "Admin", "Editor"]),
  validate,
  asyncHandler(async (req, res) => {
    const allowed = (({ name, email, role, active }) => ({ name, email, role, active }))(req.body);
    const user = await User.findByIdAndUpdate(req.params.id, allowed, { new: true }).select("-password");
    res.json({ user });
  })
);

router.delete("/:id", param("id").isMongoId(), validate, asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
}));

export default router;
