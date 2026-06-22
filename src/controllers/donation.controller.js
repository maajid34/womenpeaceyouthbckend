import { body, param } from "express-validator";
import { Donation } from "../models/Donation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const donationRules = [
  body("name").trim().notEmpty().isLength({ max: 120 }),
  body("email").isEmail().normalizeEmail(),
  body("phone").optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body("amount").isFloat({ min: 1, max: 1_000_000 }),
  body("message").optional({ checkFalsy: true }).trim().isLength({ max: 2000 })
];

export const donationIdRules = [param("id").isMongoId()];

export const createDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.create(req.body);
  res.status(201).json({ message: "Donation pledge received", donation });
});

export const listDonations = asyncHandler(async (_req, res) => {
  const donations = await Donation.find().sort({ createdAt: -1 });
  res.json({ donations });
});

export const updateDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!donation) {
    const error = new Error("Donation not found");
    error.statusCode = 404;
    throw error;
  }
  res.json({ donation });
});

export const deleteDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findByIdAndDelete(req.params.id);
  if (!donation) {
    const error = new Error("Donation not found");
    error.statusCode = 404;
    throw error;
  }
  res.json({ message: "Donation deleted" });
});
