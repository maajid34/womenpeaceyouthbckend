import { S3Client } from "@aws-sdk/client-s3";

const requiredGroups = [
  ["CLOUDFLARE_R2_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_ID"],
  ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
  ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
  ["CLOUDFLARE_R2_BUCKET_NAME", "CLOUDFLARE_R2_BUCKET"],
  ["CLOUDFLARE_R2_PUBLIC_URL", "CLOUDFLARE_R2_PUBLIC_CDN"]
];

const missingGroups = requiredGroups.filter((names) => !names.some((name) => process.env[name]));

if (missingGroups.length) {
  console.warn(
    [
      "Cloudflare R2 is not fully configured. Upload signing is disabled until .env contains:",
      ...missingGroups.map((names) => `- ${names.join(" or ")}`)
    ].join("\n")
  );
}

export const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET;
export const r2Prefix = process.env.CLOUDFLARE_R2_PREFIX || "swyp";
export const r2Cdn = (process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_CDN || "").replace(/\/$/, "");
export const r2Status = {
  configured: missingGroups.length === 0,
  missing: missingGroups.map((names) => names.join(" or ")),
  bucketConfigured: Boolean(r2Bucket),
  cdnConfigured: Boolean(r2Cdn),
  prefix: r2Prefix
};

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || ""
  }
});
