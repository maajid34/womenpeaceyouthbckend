import slugify from "slugify";
import { body, param } from "express-validator";
import { Content, contentTypes } from "../models/Content.js";
import { Contact } from "../models/Contact.js";
import { Donation } from "../models/Donation.js";
import { MediaAsset } from "../models/MediaAsset.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteManyR2Objects } from "../utils/r2Storage.js";
import { extractMediaKeys } from "../utils/mediaKeys.js";

export const typeRules = [param("type").isIn(contentTypes)];
export const idRules = [param("type").isIn(contentTypes), param("id").isMongoId()];
export const contentRules = [
  body("title").trim().notEmpty(),
  body("media").optional().isArray(),
  body("imageUrl").optional().isURL(),
  body("fileUrl").optional().isURL()
];

export const contentUpdateRules = [
  body("title").optional().trim().notEmpty(),
  body("media").optional().isArray(),
  body("imageUrl").optional({ checkFalsy: true }).isURL(),
  body("fileUrl").optional({ checkFalsy: true }).isURL()
];

const numericFields = ["budget", "fileSize", "displayOrder"];
const dateFields = ["startDate", "endDate", "publishDate", "date"];

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizePayload(req) {
  const payload = { ...req.body, type: req.params.type };
  if (!payload.slug && payload.title) {
    payload.slug = slugify(payload.title, { lower: true, strict: true });
  }
  for (const field of numericFields) {
    if (field in payload) payload[field] = toNumber(payload[field]);
  }
  for (const field of dateFields) {
    if (payload[field] === "") payload[field] = undefined;
  }
  return payload;
}

async function ensureUniqueSlug(payload) {
  if (!payload.slug) return payload;
  const baseSlug = payload.slug;
  let slug = baseSlug;
  let suffix = 2;

  while (await Content.exists({ type: payload.type, slug })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return { ...payload, slug };
}

export const listContent = asyncHandler(async (req, res) => {
  const filter = { type: req.params.type };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const items = await Content.find(filter).sort({ createdAt: -1 });
  res.json({ items });
});

export const getContent = asyncHandler(async (req, res) => {
  const item = await Content.findOne({ type: req.params.type, _id: req.params.id });
  if (!item) {
    const error = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }
  res.json({ item });
});

export const createContent = asyncHandler(async (req, res) => {
  const payload = await ensureUniqueSlug(normalizePayload(req));
  const item = await Content.create({ ...payload, createdBy: req.user._id });
  res.status(201).json({ item });
});

export const updateContent = asyncHandler(async (req, res) => {
  const item = await Content.findOne({ type: req.params.type, _id: req.params.id });
  if (!item) {
    const error = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }

  Object.assign(item, normalizePayload(req), { updatedBy: req.user._id });
  await item.save();
  res.json({ item });
});

export const deleteContent = asyncHandler(async (req, res) => {
  const item = await Content.findOne({ type: req.params.type, _id: req.params.id });
  if (!item) {
    const error = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }

  const keys = extractMediaKeys(item);
  await deleteManyR2Objects(keys);
  if (keys.length) await MediaAsset.deleteMany({ key: { $in: keys } });
  await item.deleteOne();
  res.json({ message: "Record deleted from MongoDB and attached files deleted from Cloudflare R2" });
});

export const deleteContentByType = (type) => asyncHandler(async (req, res) => {
  const item = await Content.findOne({ type, _id: req.params.id });
  if (!item) {
    const error = new Error("Record not found");
    error.statusCode = 404;
    throw error;
  }

  const keys = extractMediaKeys(item);
  await deleteManyR2Objects(keys);
  if (keys.length) await MediaAsset.deleteMany({ key: { $in: keys } });
  await item.deleteOne();
  res.json({ message: "Record deleted from MongoDB and attached files deleted from Cloudflare R2" });
});

export const dashboardStats = asyncHandler(async (_req, res) => {
  const counts = await Content.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]);
  const byType = Object.fromEntries(counts.map((item) => [item._id, item.count]));

  const [donations, contacts] = await Promise.all([
    Donation.countDocuments(),
    Contact.countDocuments()
  ]);

  const monthlyDonations = await Donation.aggregate([
    { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const projectsByStatus = await Content.aggregate([
    { $match: { type: "projects" } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const monthlyMessages = await Contact.aggregate([
    { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const contentByCategory = await Content.aggregate([
    { $match: { category: { $exists: true, $ne: "" } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    totals: {
      projects: byType.projects || 0,
      programs: byType.programs || 0,
      news: byType.news || 0,
      team: byType.team || 0,
      documents: byType.documents || 0,
      donations,
      messages: contacts,
      contacts
    },
    charts: { monthlyDonations, donationsByMonth: monthlyDonations, projectsByStatus, monthlyMessages, contentByCategory }
  });
});
