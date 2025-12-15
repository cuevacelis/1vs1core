import * as fs from "node:fs";
import * as path from "node:path";
import { getPool } from "./config";

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

/**
 * Migration files are executed in alphabetical order.
 * Naming convention: XXX_description.sql where XXX is a 3-digit number
 *
 * Migration order:
 * 001_types.sql          - ENUM types
 * 002_tables.sql         - Table definitions
 * 003_indexes.sql        - Index definitions
 * 004_functions_shared.sql - Shared/utility functions and triggers
 * 005_functions_auth.sql   - Authentication functions
 * 006_functions_user.sql   - User management functions
 * 007_functions_role.sql   - Role management functions
 * 008_seed_data.sql        - Initial data
 */
async function runMigrations() {
  const pool = getPool();

  try {
    console.log("Starting database migration...");

    const migrationsDir = path.join(__dirname, "migrations");

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    // Get all SQL files in the migrations directory
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Sort alphabetically to ensure correct execution order

    if (migrationFiles.length === 0) {
      throw new Error("No migration files found in migrations directory");
    }

    console.log(`Found ${migrationFiles.length} migration file(s):`);
    for (const file of migrationFiles) {
      console.log(`  - ${file}`);
    }
    console.log("");

    // Execute each migration file in order
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`Executing migration: ${file}...`);
      await pool.query(sql);
      console.log(`✓ ${file} completed`);
    }

    console.log("\n✅ All migrations completed successfully!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
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
