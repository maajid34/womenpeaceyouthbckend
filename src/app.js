import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import contentRoutes from "./routes/content.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import donationRoutes from "./routes/donation.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/user.routes.js";
import settingRoutes from "./routes/setting.routes.js";
import { contentRouterFor } from "./routes/resource.routes.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));

const allowedOrigins = (process.env.FRONTEND_URL || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const allowAnyOrigin = allowedOrigins.includes("*");

const corsOptions = {
  credentials: !allowAnyOrigin,
  origin(origin, callback) {
    if (!origin || allowAnyOrigin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      callback(null, true);
      return;
    }
    const error = new Error("Origin is not allowed by CORS");
    error.statusCode = 403;
    callback(error);
  }
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please try again later." }
});

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many submissions. Please try again later." }
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(generalLimiter);
app.use("/api/auth/login", loginLimiter);
app.use(["/api/contact", "/api/donations"], (req, res, next) => (
  req.method === "POST" ? submissionLimiter(req, res, next) : next()
));

app.get("/api/health/live", (_req, res) => res.json({ ok: true, service: "swyp-api" }));
app.get("/api/health", (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({ ok: databaseReady, service: "swyp-api", database: databaseReady ? "connected" : "unavailable" });
});
app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/projects", contentRouterFor("projects", { slugLookup: true }));
app.use("/api/programs", contentRouterFor("programs", { slugLookup: true }));
app.use("/api/news", contentRouterFor("news", { slugLookup: true }));
app.use("/api/team", contentRouterFor("team"));
app.use("/api/documents", contentRouterFor("documents"));
app.use("/api/publications", contentRouterFor("documents"));
app.use("/api", contentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
