import { Pool, type PoolClient } from "pg";

export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
}

// Lazy load config to ensure environment variables are loaded first
function getDbConfig(): DbConfig {
  return {
    host: process.env.DATABASE_HOST || "",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    database: process.env.DATABASE_NAME || "postgres",
    user: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "",
    ssl: process.env.DATABASE_SSL === "true",
  };
}

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const dbConfig = getDbConfig();
    console.log("Creating new database pool with host:", dbConfig.host);
    pool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

export function resetPool(): void {
  if (pool) {
    pool.end();
    pool = null;
  }
}

export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows;
}

export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
