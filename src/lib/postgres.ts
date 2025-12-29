import { Pool, type PoolClient, type PoolConfig } from "pg";

type QueryResult = {
  rows: any[];
  columns: Array<{ name: string; type: string }>;
  rowCount: number;
  executionTime: number;
};

let pool: Pool | null = null;

function getPoolConfig(): PoolConfig {
  if (process.env.POSTGRES_URL) {
    return {
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    };
  }

  return {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  };
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool(getPoolConfig());
  }
  return pool;
}

export async function executeSQL(sql: string): Promise<QueryResult> {
  const start = Date.now();
  const client: PoolClient = await getPool().connect();

  try {
    const res = await client.query(sql);
    return {
      rows: res.rows,
      columns: res.fields.map((f) => ({
        name: f.name,
        type: String(f.dataTypeID),
      })),
      rowCount: res.rowCount ?? 0,
      executionTime: Date.now() - start,
    };
  } finally {
    client.release();
  }
}

export async function testConnection(): Promise<boolean> {
  const client: PoolClient = await getPool().connect();
  try {
    await client.query("SELECT 1");
    return true;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
