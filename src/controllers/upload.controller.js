import { body, param } from "express-validator";
import { MediaAsset } from "../models/MediaAsset.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { r2Status } from "../config/r2.js";
import { allowedFolders, allowedMimeTypes, createR2Key, maxUploadBytes, publicUrlForKey } from "../utils/r2Keys.js";
import { r2Prefix } from "../config/r2.js";
import { createSignedUploadUrl, deleteR2Object } from "../utils/r2Storage.js";

export const signUploadRules = [
  body("folder").isIn([...allowedFolders]),
  body("filename").trim().notEmpty(),
  body("contentType").isIn([...allowedMimeTypes.keys()]),
  body("size").isInt({ min: 1, max: maxUploadBytes })
];

export const completeUploadRules = [
  body("folder").isIn([...allowedFolders]),
  body("key").trim().notEmpty(),
  body("originalName").trim().notEmpty(),
  body("contentType").isIn([...allowedMimeTypes.keys()]),
  body("size").isInt({ min: 1, max: maxUploadBytes }),
  body("title").optional().trim(),
  body("entityType").optional().trim(),
  body("entityId").optional().isMongoId()
];

export const deleteUploadRules = [param("id").isMongoId()];

export const signUpload = asyncHandler(async (req, res) => {
  const key = createR2Key({
    folder: req.body.folder,
    filename: req.body.filename,
    contentType: req.body.contentType
  });

  const signed = await createSignedUploadUrl({
    key,
    contentType: req.body.contentType
  });

  res.json(signed);
});

export const uploadConfig = asyncHandler(async (_req, res) => {
  res.json({
    r2: r2Status,
    allowedFolders: [...allowedFolders],
    allowedMimeTypes: [...allowedMimeTypes.keys()],
    maxUploadBytes
  });
});

export const completeUpload = asyncHandler(async (req, res) => {
  const expectedPrefix = `${r2Prefix}/${req.body.folder}/`;
  if (!req.body.key.startsWith(expectedPrefix)) {
    const error = new Error("Upload key does not match the selected R2 folder");
    error.statusCode = 400;
    throw error;
  }

  const media = await MediaAsset.create({
    title: req.body.title,
    folder: req.body.folder,
    key: req.body.key,
    url: publicUrlForKey(req.body.key),
    originalName: req.body.originalName,
    contentType: req.body.contentType,
    size: req.body.size,
    entityType: req.body.entityType,
    entityId: req.body.entityId,
    uploadedBy: req.user._id
  });

  res.status(201).json({ media });
});

export const listMedia = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.folder) query.folder = req.query.folder;
  if (req.query.entityType) query.entityType = req.query.entityType;

  const media = await MediaAsset.find(query).sort({ createdAt: -1 }).limit(200);
  res.json({ media });
});

export const deleteUpload = asyncHandler(async (req, res) => {
  const media = await MediaAsset.findById(req.params.id);
  if (!media) {
    const error = new Error("Media asset not found");
    error.statusCode = 404;
    throw error;
  }

  await deleteR2Object(media.key);
  await media.deleteOne();
  res.json({ message: "Media deleted from MongoDB and Cloudflare R2" });
});
