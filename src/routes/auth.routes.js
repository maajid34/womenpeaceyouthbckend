import { Router } from "express";
import { authenticate, authorize, roles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { bootstrapSuperAdmin, changePassword, changePasswordRules, login, loginRules, me, register, registerRules } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", loginRules, validate, login);
router.post("/bootstrap", bootstrapSuperAdmin);
router.post("/register", authenticate, authorize(roles.SUPER_ADMIN), registerRules, validate, register);
router.get("/me", authenticate, me);
router.put("/change-password", authenticate, changePasswordRules, validate, changePassword);

export default router;
