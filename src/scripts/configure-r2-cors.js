import dotenv from "dotenv";

dotenv.config();

const [{ PutBucketCorsCommand }, { r2Bucket, r2Client, r2Status }] = await Promise.all([
  import("@aws-sdk/client-s3"),
  import("../config/r2.js")
]);

function originsFromEnvironment() {
  const configured = (process.env.FRONTEND_URL || process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return [
    ...new Set([
      ...configured,
      "https://somaliwomenyouthpeace.org",
      "https://www.somaliwomenyouthpeace.org",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:4173",
      "http://127.0.0.1:4173"
    ])
  ];
}

async function configureWithS3(allowedOrigins) {
  await r2Client.send(
    new PutBucketCorsCommand({
      Bucket: r2Bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            ID: "swyp-browser-direct-uploads",
            AllowedOrigins: allowedOrigins,
            AllowedMethods: ["GET", "HEAD", "PUT"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600
          }
        ]
      }
    })
  );
}

async function configureWithCloudflareApi(allowedOrigins) {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${encodeURIComponent(r2Bucket)}/cors`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rules: [
          {
            allowed: {
              origins: allowedOrigins,
              methods: ["GET", "HEAD", "PUT"],
              headers: ["*"]
            },
            exposeHeaders: ["ETag"],
            maxAgeSeconds: 3600
          }
        ]
      })
    }
  );

  const result = await response.json();
  if (!response.ok || result.success === false) {
    throw new Error(result.errors?.map((item) => item.message).join("; ") || `Cloudflare API returned ${response.status}`);
  }
}

async function main() {
  if (!r2Status.configured) {
    throw new Error(`Missing R2 configuration: ${r2Status.missing.join(", ")}`);
  }

  const allowedOrigins = originsFromEnvironment();

  try {
    await configureWithS3(allowedOrigins);
    console.log("R2 CORS configured through the S3 API.");
  } catch (error) {
    if (error.name !== "AccessDenied" && error.Code !== "AccessDenied") throw error;
    if (!process.env.CLOUDFLARE_API_TOKEN) {
      throw new Error(
        "The R2 access key cannot edit bucket CORS. Add a Cloudflare API token with R2 Edit permission as CLOUDFLARE_API_TOKEN, or add this policy in Cloudflare Dashboard > R2 > sywpbucket > Settings > CORS."
      );
    }
    await configureWithCloudflareApi(allowedOrigins);
    console.log("R2 CORS configured through the Cloudflare API.");
  }

  console.log(`Bucket: ${r2Bucket}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
  console.log("Allowed methods: GET, HEAD, PUT");
}

main().catch((error) => {
  console.error(`R2 CORS setup failed: ${error.message}`);
  process.exitCode = 1;
});
