import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    url: String,
    key: String,
    title: String,
    originalName: String,
    contentType: String,
    size: Number,
    uploadedAt: Date
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: String,
    fullDescription: String,
    date: Date,
    client: { type: String, trim: true },
    location: { type: String, trim: true },
    imageUrl: String,
    photos: [mediaSchema]
  },
  { _id: true }
);

const contentTypes = [
  "projects",
  "programs",
  "news",
  "team",
  "documents",
  "policies",
  "reports",
  "resources",
  "donors",
  "organization"
];

const contentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: contentTypes },
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    status: { type: String, trim: true },
    category: { type: String, trim: true },
    icon: { type: String, trim: true },
    shortDescription: { type: String, trim: true },
    description: { type: String, trim: true },
    fullDescription: String,
    content: String,
    location: { type: String, trim: true },
    budget: Number,
    donor: { type: String, trim: true },
    author: { type: String, trim: true },
    department: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    startDate: Date,
    endDate: Date,
    publishDate: Date,
    date: Date,
    startTime: String,
    endTime: String,
    displayOrder: { type: Number, default: 0 },
    objectives: [String],
    activities: [String],
    activityDetails: [activitySchema],
    achievements: [String],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    imageUrl: String,
    fileUrl: String,
    fileKey: String,
    fileType: String,
    fileSize: Number,
    originalName: String,
    media: [mediaSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

contentSchema.index({ type: 1, slug: 1 }, { unique: true, sparse: true });

export const Content = mongoose.model("Content", contentSchema);
export { contentTypes };
