import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    archived: { type: Boolean, default: false },
    repliedAt: Date
  },
  { timestamps: true }
);

export const Contact = mongoose.model("Contact", contactSchema);
