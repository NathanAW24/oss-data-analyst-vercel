import { config } from "dotenv";
import { Pool } from "pg";

// Load env vars from .env.local (if present) then .env
config({ path: ".env.local", override: true });
config();

// Database to create (defaults to PGDATABASE or fallback name)
const targetDb = process.env.PGDATABASE || "oss_data_analyst";
// Database to connect to for admin commands (must already exist)
const adminDb = process.env.PGADMIN_DB || "postgres";

const pool = new Pool({
  database: adminDb,
});

async function main() {
  console.log(`🔧 Ensuring Postgres database "${targetDb}" exists...`);
  const client = await pool.connect();
  try {
    const exists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );

    if (exists.rowCount && exists.rowCount > 0) {
      console.log("✅ Database already exists, nothing to do");
      return;
    }

    // Simple identifier escaping (double any embedded quotes)
    const dbIdent = targetDb.replace(/"/g, '""');
    await client.query(`CREATE DATABASE "${dbIdent}"`);
    console.log("✅ Database created");
  } catch (error) {
    console.error("❌ Failed to create database:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
