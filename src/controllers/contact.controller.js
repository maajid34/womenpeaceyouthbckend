import nodemailer from "nodemailer";
import { body, param } from "express-validator";
import { Contact } from "../models/Contact.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const contactRules = [
  body("name").trim().notEmpty().isLength({ max: 120 }),
  body("email").isEmail().normalizeEmail(),
  body("subject").trim().notEmpty().isLength({ max: 200 }),
  body("message").trim().notEmpty().isLength({ max: 5000 })
];

export const contactIdRules = [param("id").isMongoId()];

function mailer() {
  if (!process.env.SMTP_HOST || process.env.SMTP_HOST === "smtp.example.com") return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

export const submitContact = asyncHandler(async (req, res) => {
  const contact = await Contact.create(req.body);
  const transport = mailer();
  if (transport) {
    try {
      await transport.sendMail({
        from: process.env.MAIL_FROM,
        to: process.env.MAIL_TO || "info@somaliwomenyouthpeace.org",
        replyTo: req.body.email,
        subject: `SWYP Contact: ${req.body.subject}`,
        text: `${req.body.name} <${req.body.email}>\n\n${req.body.message}`
      });
    } catch (error) {
      console.error(`Contact email delivery failed for ${contact._id}: ${error.message}`);
    }
  }
  res.status(201).json({ message: "Contact message received", contact });
});

export const listContacts = asyncHandler(async (_req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 });
  res.json({ contacts });
});

export const archiveContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, { archived: true }, { new: true });
  if (!contact) {
    const error = new Error("Message not found");
    error.statusCode = 404;
    throw error;
  }
  res.json({ contact });
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!contact) {
    const error = new Error("Message not found");
    error.statusCode = 404;
    throw error;
  }
  res.json({ contact });
});

export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) {
    const error = new Error("Message not found");
    error.statusCode = 404;
    throw error;
  }
  res.json({ message: "Message deleted" });
});
