import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const roles = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor"
};

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (cause) {
    const error = new Error(cause.name === "TokenExpiredError" ? "Session expired. Please sign in again." : "Invalid session. Please sign in again.");
    error.statusCode = 401;
    error.code = "AUTH_TOKEN_INVALID";
    throw error;
  }
  const user = await User.findById(decoded.id).select("-password");
  if (!user || !user.active) {
    const error = new Error("User not found or inactive");
    error.statusCode = 401;
    throw error;
  }

  req.user = user;
  next();
});

export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!allowedRoles.includes(req.user?.role)) {
    const error = new Error("You do not have permission to perform this action");
    error.statusCode = 403;
    return next(error);
  }
  next();
};

export const canUpload = authorize(roles.SUPER_ADMIN, roles.ADMIN, roles.EDITOR);
export const canEdit = authorize(roles.SUPER_ADMIN, roles.ADMIN);
export const canDelete = authorize(roles.SUPER_ADMIN);
