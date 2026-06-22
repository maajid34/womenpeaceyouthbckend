import mongoose from "mongoose";

const mediaAssetSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    folder: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    originalName: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true, max: 50 * 1024 * 1024 },
    entityType: { type: String, trim: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const MediaAsset = mongoose.model("MediaAsset", mediaAssetSchema);
