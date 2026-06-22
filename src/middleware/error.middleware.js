export function notFound(req, _res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  let status = error.statusCode || 500;
  let message = error.message || "Server error";
  const isProduction = process.env.NODE_ENV === "production";

  if (error.name === "ValidationError" || error.name === "CastError") {
    status = 400;
    message = error.message;
  }

  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    status = 401;
    message = "Invalid or expired session. Please sign in again.";
  }

  if (error.code === 11000) {
    status = 409;
    const fields = Object.keys(error.keyPattern || error.keyValue || {}).join(", ") || "record";
    message = `Duplicate ${fields}. Please use a unique value.`;
  }

  if (isProduction && status >= 500) {
    console.error(error);
    message = "Server error";
  }

  res.status(status).json({
    message,
    code: error.code,
    errors: status < 500 ? error.errors : undefined,
    stack: isProduction ? undefined : error.stack
  });
}
