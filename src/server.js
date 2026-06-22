import dotenv from "dotenv";
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters in production");
}
if (process.env.NODE_ENV === "production") {
  const frontendOrigins = process.env.FRONTEND_URL || process.env.CLIENT_URL || "";
  if (!frontendOrigins || frontendOrigins.split(",").map((origin) => origin.trim()).includes("*")) {
    throw new Error("FRONTEND_URL must contain an explicit production origin and cannot use *");
  }
}

const [{ default: app }, { connectDatabase }] = await Promise.all([
  import("./app.js"),
  import("./config/database.js")
]);

const port = process.env.PORT || 5210;
const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0");

try {
  await connectDatabase();
} catch (error) {
  console.error(`Backend startup failed: ${error.message}`);
  process.exit(1);
}

const server = app.listen(port, host, () => {
  console.log(`SWYP API running on ${host}:${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Backend startup failed: port ${port} is already in use.`);
  } else {
    console.error(`Backend server error: ${error.message}`);
  }
  process.exit(1);
});

function shutdown(signal) {
  console.log(`${signal} received; closing SWYP API.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (error) => {
  console.error("Unhandled backend promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught backend exception:", error);
  shutdown("uncaughtException");
});
