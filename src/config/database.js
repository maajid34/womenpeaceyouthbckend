import mongoose from "mongoose";

export function getMongoUri() {
  return process.env.MONGO_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
}

export async function connectDatabase() {
  const mongoUri = getMongoUri();
  if (!mongoUri) {
    throw new Error("MongoDB connection string is required. Set MONGO_URI, MONGO_URL, or DATABASE_URL in .env");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}
