import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    amount: { type: Number, required: true, min: 1 },
    message: String
  },
  { timestamps: true }
);

export const Donation = mongoose.model("Donation", donationSchema);
