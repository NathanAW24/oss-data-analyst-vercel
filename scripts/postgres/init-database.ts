import { config } from "dotenv";
import { Pool } from "pg";

// Load env vars from .env.local (if present) then .env
config({ path: ".env.local", override: true });
config();

const pool = new Pool();

async function main() {
  console.log("🔧 Initializing Postgres database...");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        industry TEXT NOT NULL,
        employee_count INTEGER,
        revenue NUMERIC,
        founded_year INTEGER,
        country TEXT,
        city TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS people (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        company_id INTEGER REFERENCES companies(id),
        job_title TEXT,
        department TEXT,
        salary NUMERIC,
        hire_date DATE,
        birth_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        account_number TEXT UNIQUE NOT NULL,
        company_id INTEGER REFERENCES companies(id),
        account_manager_id INTEGER REFERENCES people(id),
        status TEXT NOT NULL,
        account_type TEXT NOT NULL,
        monthly_value NUMERIC,
        total_revenue NUMERIC,
        contract_start_date DATE,
        contract_end_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_people_company_id ON people(company_id);
      CREATE INDEX IF NOT EXISTS idx_accounts_company_id ON accounts(company_id);
      CREATE INDEX IF NOT EXISTS idx_accounts_manager_id ON accounts(account_manager_id);
      CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);
      CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number);
    `);

    await client.query("COMMIT");
    console.log("✅ Postgres tables created successfully");
    console.log("📊 Tables: companies, people, accounts");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Failed to initialize Postgres schema:", error);
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
