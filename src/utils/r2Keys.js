import crypto from "crypto";
import path from "path";
import slugify from "slugify";
import { r2Cdn, r2Prefix } from "../config/r2.js";

export const allowedFolders = new Set([
  "projects",
  "programs",
  "news",
  "team",
  "documents",
  "policies",
  "reports",
  "resources",
  "donors",
  "organization"
]);

export const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["application/pdf", ".pdf"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", ".pptx"]
]);

export const maxUploadBytes = 50 * 1024 * 1024;

export function createR2Key({ folder, filename, contentType }) {
  if (!allowedFolders.has(folder)) {
    const error = new Error("Invalid upload folder");
    error.statusCode = 400;
    throw error;
  }

  if (!allowedMimeTypes.has(contentType)) {
    const error = new Error("Unsupported file type");
    error.statusCode = 400;
    throw error;
  }

  const suppliedExtension = path.extname(filename || "");
  const extension = allowedMimeTypes.get(contentType);
  const baseName = slugify(path.basename(filename || "file", suppliedExtension), { lower: true, strict: true }) || "file";
  const unique = crypto.randomBytes(8).toString("hex");
  return `${r2Prefix}/${folder}/${Date.now()}-${unique}-${baseName}${extension.toLowerCase()}`;
}

export function publicUrlForKey(key) {
  const encodedKey = String(key)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${r2Cdn}/${encodedKey}`;
}
