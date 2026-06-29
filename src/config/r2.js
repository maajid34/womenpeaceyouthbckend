import { S3Client } from "@aws-sdk/client-s3";

const requiredGroups = [
  ["CLOUDFLARE_R2_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_ID"],
  ["CLOUDFLARE_R2_ACCESS_KEY_ID"],
  ["CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
  ["CLOUDFLARE_R2_BUCKET_NAME", "CLOUDFLARE_R2_BUCKET"],
  ["CLOUDFLARE_R2_PUBLIC_URL", "CLOUDFLARE_R2_PUBLIC_CDN"]
];

const envValue = (...names) => names.map((name) => process.env[name]?.trim()).find(Boolean) || "";

const r2AccountIdValue = envValue("CLOUDFLARE_R2_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_ID");
const r2BucketValue = envValue("CLOUDFLARE_R2_BUCKET_NAME", "CLOUDFLARE_R2_BUCKET");
const r2CdnValue = envValue("CLOUDFLARE_R2_PUBLIC_URL", "CLOUDFLARE_R2_PUBLIC_CDN");
const invalidAccountId = r2AccountIdValue && !/^[a-f0-9]{32}$/i.test(r2AccountIdValue);
const missingGroups = requiredGroups.filter((names) => !names.some((name) => process.env[name]?.trim()));

if (invalidAccountId) {
  console.warn("Cloudflare R2 account id is invalid. It must be the full 32-character account id from Cloudflare.");
}

if (missingGroups.length) {
  console.warn(
    [
      "Cloudflare R2 is not fully configured. Upload signing is disabled until .env contains:",
      ...missingGroups.map((names) => `- ${names.join(" or ")}`)
    ].join("\n")
  );
}

export const r2AccountId = r2AccountIdValue;
export const r2Bucket = r2BucketValue;
export const r2Prefix = process.env.CLOUDFLARE_R2_PREFIX?.trim() || "swyp";
export const r2Cdn = r2CdnValue.replace(/\/$/, "");
export const r2Status = {
  configured: missingGroups.length === 0 && !invalidAccountId,
  missing: [...missingGroups.map((names) => names.join(" or ")), ...(invalidAccountId ? ["valid 32-character CLOUDFLARE_R2_ACCOUNT_ID or CLOUDFLARE_ACCOUNT_ID"] : [])],
  bucketConfigured: Boolean(r2Bucket),
  cdnConfigured: Boolean(r2Cdn),
  prefix: r2Prefix
};

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() || ""
  }
});
