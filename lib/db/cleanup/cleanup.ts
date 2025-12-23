import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getPool, resetPool } from "../config";

// Load environment variables from .env file
const envPath = join(process.cwd(), ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, "");
        process.env[key.trim()] = cleanValue;
      }
    }
  });
}

async function cleanDatabase() {
  const pool = getPool();

  try {
    console.log("🗑️  Starting database cleanup...\n");

    // Read cleanup SQL file
    const cleanupPath = join(__dirname, "cleanup.sql");
    const cleanupSQL = readFileSync(cleanupPath, "utf-8");

    console.log("Executing cleanup script...");

    // Execute cleanup
    await pool.query(cleanupSQL);

    console.log("\n✅ Database cleanup completed successfully!");
    console.log("All tables, functions, and types have been dropped.\n");
  } catch (error) {
    console.error("\n❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    resetPool();
  }
}

cleanDatabase();
