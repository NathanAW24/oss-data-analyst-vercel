import { config } from "dotenv";
import {
  closePool,
  executeSQL,
  getPool,
  getSchema,
  testConnection,
} from "@/lib/postgresql";

// Load env vars from .env.local first, then .env
config({ path: ".env.local", override: true });
config();

async function run() {
  console.log("=== Postgres adapter smoke test ===");

  // Ensure pool can be created
  getPool();

  // Test connection
  const ok = await testConnection();
  console.log("testConnection:", ok ? "OK" : "FAILED");

  // Run a simple query
  try {
    const res = await executeSQL("SELECT NOW() AS now, CURRENT_DATABASE() AS db");
    console.log("executeSQL sample rows:", res.rows);
  } catch (err) {
    console.error("executeSQL failed:", err);
  }

  // Try schema introspection (may be empty if no tables)
  try {
    const schema = await getSchema();
    console.log(
      "getSchema tables:",
      schema.map((t) => `${t.schema}.${t.table}`)
    );
  } catch (err) {
    console.error("getSchema failed:", err);
  }

  // Generic selects from main tables
  const tables = ["main.companies", "main.people", "main.accounts"];
  for (const tbl of tables) {
    try {
      const res = await executeSQL(`SELECT * FROM ${tbl} LIMIT 3`);
      console.log(`Rows from ${tbl}:`, res.rows);
    } catch (err) {
      console.error(`Select failed for ${tbl}:`, err);
    }
  }

  await closePool();
  console.log("=== Done ===");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
