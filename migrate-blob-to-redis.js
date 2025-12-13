// One-time migration script to copy data from Vercel Blob to Upstash Redis
import dotenv from "dotenv";
import { head } from "@vercel/blob";
import { Redis } from "@upstash/redis";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const BLOB_FILENAME = "prices.json";
const REDIS_KEY = "prices";

async function migrate() {
  console.log("Starting migration from Vercel Blob to Upstash Redis...");

  // Initialize Redis
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    // Get data from Blob
    console.log("Fetching data from Vercel Blob...");
    const blob = await head(BLOB_FILENAME);

    if (!blob) {
      console.log("No data found in Blob. Nothing to migrate.");
      return;
    }

    const response = await fetch(blob.url);
    const data = await response.json();

    console.log(`Found ${data.prices?.length || 0} price entries in Blob`);

    // Save to Redis
    console.log("Saving data to Upstash Redis...");
    await redis.set(REDIS_KEY, data);

    console.log("✅ Migration completed successfully!");
    console.log(`Migrated ${data.prices?.length || 0} price entries to Redis`);

    // Verify
    const verifyData = await redis.get(REDIS_KEY);
    console.log(`✅ Verified: ${verifyData.prices?.length || 0} entries in Redis`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
