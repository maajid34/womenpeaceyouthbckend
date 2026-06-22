import { Router } from "express";
import { authenticate, canDelete, canEdit } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { archiveContact, contactIdRules, contactRules, deleteContact, listContacts, submitContact, updateContact } from "../controllers/contact.controller.js";

const router = Router();

router.post("/", contactRules, validate, submitContact);
router.get("/", authenticate, listContacts);
router.put("/:id", authenticate, canEdit, contactIdRules, contactRules, validate, updateContact);
router.put("/:id/archive", authenticate, canEdit, contactIdRules, validate, archiveContact);
router.delete("/:id", authenticate, canDelete, contactIdRules, validate, deleteContact);

export default router;
