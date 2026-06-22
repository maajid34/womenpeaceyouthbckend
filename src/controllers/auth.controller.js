import { body } from "express-validator";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/token.js";

function userPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export const registerRules = [
  body("name").trim().notEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  body("role").optional().isIn(["Super Admin", "Admin", "Editor"])
];

export const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty()
];

export const changePasswordRules = [
  body("currentPassword").notEmpty(),
  body("newPassword").isLength({ min: 8 })
];

export const register = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role || "Editor"
  });

  res.status(201).json({ user: userPayload(user), token: signToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+password");
  if (!user || !user.active || !(await user.comparePassword(req.body.password))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  res.json({ user: userPayload(user), token: signToken(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: userPayload(req.user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(req.body.currentPassword))) {
    const error = new Error("Current password is incorrect");
    error.statusCode = 422;
    throw error;
  }

  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: "Password changed successfully" });
});

export const bootstrapSuperAdmin = asyncHandler(async (req, res) => {
  const bootstrapEnabled = process.env.ENABLE_ADMIN_BOOTSTRAP === "true";
  const suppliedKey = req.get("x-bootstrap-key");
  const configuredKey = process.env.ADMIN_BOOTSTRAP_KEY;

  if (process.env.NODE_ENV === "production" || !bootstrapEnabled || !configuredKey || suppliedKey !== configuredKey) {
    const error = new Error("Bootstrap is disabled or unauthorized");
    error.statusCode = 403;
    throw error;
  }

  const existing = await User.findOne({ role: "Super Admin" });
  const email = process.env.SEED_SUPER_ADMIN_EMAIL || "admin@somaliwomenyouthpeace.org";
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    const error = new Error("SEED_SUPER_ADMIN_PASSWORD must contain at least 12 characters");
    error.statusCode = 500;
    throw error;
  }
  let user = existing;

  if (user) {
    user.email = user.email || email;
    user.name = user.name || "SWYP Super Admin";
    user.password = password;
    user.active = true;
    await user.save();
  } else {
    user = await User.create({
      name: "SWYP Super Admin",
      email,
      password,
      role: "Super Admin"
    });
  }

  res.status(201).json({
    message: existing ? "Super Admin password reset" : "Super Admin created",
    user: userPayload(user),
    email: user.email
  });
});
