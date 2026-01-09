import { Pool } from "pg";

type PgPool = Pool;

let pool: PgPool | null = null;

/**
 * Get or create Postgres connection pool
 */
export function getPool(): PgPool {
  if (!pool) {
    pool = new Pool();
    console.log("[Postgres] Pool created with environment configuration");
  }
  return pool;
}

/**
 * Execute SQL query and return results
 */
export interface QueryResult {
  rows: any[];
  columns: string[];
  rowCount: number;
  executionTime: number;
}

export async function executeSQL(sql: string): Promise<QueryResult> {
  const startTime = Date.now();
  console.log(`[Postgres] Executing query: ${sql.substring(0, 100)}...`);

  const client = await getPool().connect();
  try {
    const result = await client.query(sql);
    const executionTime = Date.now() - startTime;

    const columns =
      result.fields?.map((f) => f.name) ??
      (result.rows[0] ? Object.keys(result.rows[0]) : []);

    console.log(
      `[Postgres] Query completed in ${executionTime}ms, returned ${
        result.rowCount ?? result.rows.length
      } rows`
    );

    return {
      rows: result.rows,
      columns,
      rowCount: result.rowCount ?? result.rows.length,
      executionTime,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(
      `[Postgres] Query failed after ${executionTime}ms:`,
      error.message
    );
    throw new Error(`Postgres Error: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Get database schema information (tables, columns, foreign keys)
 */
export async function getSchema(): Promise<
  Array<{
    table: string;
    schema: string;
    columns: Array<{
      name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>;
    foreignKeys: Array<{
      column: string;
      references_table: string;
      references_column: string;
    }>;
  }>
> {
  const client = await getPool().connect();
  try {
    const tables = await client.query(
      `
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY table_schema, table_name;
      `
    );

    const results: Array<{
      table: string;
      schema: string;
      columns: any[];
      foreignKeys: any[];
    }> = [];

    for (const t of tables.rows) {
      const { table_schema, table_name } = t as {
        table_schema: string;
        table_name: string;
      };

      const columns = (
        await client.query(
          `
            SELECT
              column_name,
              data_type,
              is_nullable,
              column_default
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = $2
            ORDER BY ordinal_position;
          `,
          [table_schema, table_name]
        )
      ).rows.map((c) => ({
        name: c.column_name,
        data_type: c.data_type,
        is_nullable: c.is_nullable,
        column_default: c.column_default,
      }));

      const foreignKeys = (
        await client.query(
          `
            SELECT
              kcu.column_name AS column,
              ccu.table_schema AS references_schema,
              ccu.table_name AS references_table,
              ccu.column_name AS references_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = $1
              AND tc.table_name = $2;
          `,
          [table_schema, table_name]
        )
      ).rows.map((fk) => ({
        column: fk.column,
        references_table:
          fk.references_schema === table_schema
            ? fk.references_table
            : `${fk.references_schema}.${fk.references_table}`,
        references_column: fk.references_column,
      }));

      results.push({
        table: table_name,
        schema: table_schema,
        columns,
        foreignKeys,
      });
    }

    return results;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  const client = await getPool().connect();
  try {
    const result = await client.query("SELECT 1 as test");
    return result.rows[0]?.test === 1;
  } catch (error) {
    console.error("[Postgres] Connection test failed:", error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Close pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    console.log("[Postgres] Closing connection pool");
    await pool.end();
    pool = null;
  }
}

/**
 * Estimate query cost (placeholder for Postgres)
 */
export async function estimateQueryCost(sql: string): Promise<{
  estimatedRows: number;
  estimatedCost: string;
}> {
  console.log(
    "[Postgres] Cost estimation not implemented; returning placeholder"
  );
  return {
    estimatedRows: 0,
    estimatedCost: "unknown",
  };
}
