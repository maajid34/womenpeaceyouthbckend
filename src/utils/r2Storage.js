import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Bucket, r2Client, r2Status } from "../config/r2.js";
import { publicUrlForKey } from "./r2Keys.js";

function r2Configured() {
  return r2Status.configured;
}

export async function createSignedUploadUrl({ key, contentType }) {
  if (!r2Configured()) {
    const error = new Error("Cloudflare R2 is not configured. Add R2 credentials in .env before uploading files.");
    error.statusCode = 503;
    throw error;
  }

  const command = new PutObjectCommand({
    Bucket: r2Bucket,
    Key: key,
    ContentType: contentType
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 10 * 60 });
  return {
    key,
    uploadUrl,
    publicUrl: publicUrlForKey(key),
    uploadHeaders: { "Content-Type": contentType },
    expiresIn: 600
  };
}

export async function deleteR2Object(key) {
  if (!key) return;
  if (!r2Configured()) {
    console.warn(`Skipping R2 delete for ${key}; Cloudflare R2 is not configured.`);
    return;
  }
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: key }));
  } catch (error) {
    error.message = `Cloudflare R2 delete failed for ${key}: ${error.message}`;
    throw error;
  }
}

export async function deleteManyR2Objects(keys = []) {
  await Promise.all([...new Set(keys.filter(Boolean))].map((key) => deleteR2Object(key)));
}
