import { Router } from "express";
import { param } from "express-validator";
import { authenticate, canDelete, canEdit, canUpload } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { contentRules, contentUpdateRules, deleteContentByType } from "../controllers/content.controller.js";
import { Content } from "../models/Content.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import slugify from "slugify";

const numericFields = ["budget", "fileSize", "displayOrder"];
const dateFields = ["startDate", "endDate", "publishDate", "date"];

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalize(type, body, userId, isUpdate = false) {
  const payload = { ...body, type };
  if (!payload.slug && payload.title) payload.slug = slugify(payload.title, { lower: true, strict: true });
  for (const field of numericFields) {
    if (field in payload) payload[field] = toNumber(payload[field]);
  }
  for (const field of dateFields) {
    if (payload[field] === "") payload[field] = undefined;
  }
  if (isUpdate) payload.updatedBy = userId;
  else payload.createdBy = userId;
  return payload;
}

async function ensureUniqueSlug(type, payload, currentId) {
  if (!payload.slug) return payload;
  const baseSlug = payload.slug;
  let slug = baseSlug;
  let suffix = 2;
  const filter = { type, slug };
  if (currentId) filter._id = { $ne: currentId };

  while (await Content.exists(filter)) {
    slug = `${baseSlug}-${suffix}`;
    filter.slug = slug;
    suffix += 1;
  }

  return { ...payload, slug };
}

export function contentRouterFor(type, options = {}) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const filter = { type };
      if (req.query.status) filter.status = req.query.status;
      if (req.query.category) filter.category = req.query.category;
      const items = await Content.find(filter).sort({ displayOrder: 1, createdAt: -1 });
      res.json({ items });
    })
  );

  router.get(
    "/:identifier",
    param("identifier").notEmpty(),
    validate,
    asyncHandler(async (req, res) => {
      const query = options.slugLookup && !req.params.identifier.match(/^[0-9a-fA-F]{24}$/)
        ? { type, slug: req.params.identifier }
        : { type, _id: req.params.identifier };
      const item = await Content.findOne(query);
      if (!item) {
        const error = new Error("Record not found");
        error.statusCode = 404;
        throw error;
      }
      res.json({ item });
    })
  );

  router.post(
    "/",
    authenticate,
    canUpload,
    contentRules,
    validate,
    asyncHandler(async (req, res) => {
      const payload = await ensureUniqueSlug(type, normalize(type, req.body, req.user._id));
      const item = await Content.create(payload);
      res.status(201).json({ item });
    })
  );

  if (!options.noPut) {
    router.put(
      "/:id",
      authenticate,
      canEdit,
      param("id").isMongoId(),
      contentUpdateRules,
      validate,
      asyncHandler(async (req, res) => {
        const item = await Content.findOneAndUpdate(
          { type, _id: req.params.id },
          await ensureUniqueSlug(type, normalize(type, req.body, req.user._id, true), req.params.id),
          { new: true, runValidators: true }
        );
        if (!item) {
          const error = new Error("Record not found");
          error.statusCode = 404;
          throw error;
        }
        res.json({ item });
      })
    );
  }

  router.delete("/:id", authenticate, canDelete, param("id").isMongoId(), validate, deleteContentByType(type));

  return router;
}
