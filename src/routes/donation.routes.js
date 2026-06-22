import { Router } from "express";
import { authenticate, canDelete, canEdit } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { createDonation, deleteDonation, donationIdRules, donationRules, listDonations, updateDonation } from "../controllers/donation.controller.js";

const router = Router();

router.post("/", donationRules, validate, createDonation);
router.get("/", authenticate, listDonations);
router.put("/:id", authenticate, canEdit, donationIdRules, donationRules, validate, updateDonation);
router.delete("/:id", authenticate, canDelete, donationIdRules, validate, deleteDonation);

export default router;
