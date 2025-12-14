import { getPool } from "./config";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env file
const envPath = path.join(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
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

console.log("Database connection config:");
console.log("  HOST:", process.env.DATABASE_HOST);
console.log("  PORT:", process.env.DATABASE_PORT);
console.log("  NAME:", process.env.DATABASE_NAME);
console.log("  USER:", process.env.DATABASE_USER);
console.log("  SSL:", process.env.DATABASE_SSL);

async function runMigrations() {
  const pool = getPool();

  try {
    console.log("Starting database migration...");

    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    await pool.query(schema);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runMigrations };
