// lib/tools/execute-postgresql.ts
import { tool } from "ai";
import { z } from "zod";
import { executeSQL, getPool } from "@/lib/postgresql";
import type { FinalizedPlan } from "@/lib/planning/types";
import { loadEntityYaml } from "@/lib/semantic/io";
import { attemptRepair } from "@/lib/execute/repair";

// Query result cache to avoid hitting database for identical queries
const queryCache = new Map<
  string,
  {
    rows: any[];
    columns: Array<{ name: string; type: string }>;
    cachedAt: number;
  }
>();

// Cache settings
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_SIZE = 100; // Maximum number of cached queries

// Helper to clean old cache entries
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now - value.cachedAt > CACHE_MAX_AGE_MS) {
      queryCache.delete(key);
      console.log(`[QueryCache] Expired cache entry removed`);
    }
  }

  // Enforce size limit
  if (queryCache.size > CACHE_MAX_SIZE) {
    const entries = Array.from(queryCache.entries()).sort(
      (a, b) => a[1].cachedAt - b[1].cachedAt
    );
    const toRemove = entries.slice(0, queryCache.size - CACHE_MAX_SIZE);
    for (const [key] of toRemove) {
      queryCache.delete(key);
      console.log(`[QueryCache] Size limit reached, removed oldest entry`);
    }
  }
}

export function clearQueryCache() {
  queryCache.clear();
  console.log("[QueryCache] All query cache entries cleared");
}

export function getQueryCacheSize(): number {
  return queryCache.size;
}

async function estimateQueryCost(sql: string): Promise<{
  estimatedRows: number;
  estimatedCost: string;
}> {
  const client = await getPool().connect();
  try {
    const res = await client.query(`EXPLAIN (FORMAT JSON) ${sql}`);
    const row = res.rows?.[0] ?? {};
    const planJson =
      row["QUERY PLAN"] ?? row["QUERY_PLAN"] ?? row["query_plan"];
    const planRoot = Array.isArray(planJson) ? planJson[0]?.Plan : planJson?.Plan;
    const estimatedRows = Number(planRoot?.["Plan Rows"] ?? 0);
    const totalCost = planRoot?.["Total Cost"];

    return {
      estimatedRows: Number.isFinite(estimatedRows) ? estimatedRows : 0,
      estimatedCost:
        typeof totalCost === "number" ? totalCost.toFixed(2) : "unknown",
    };
  } catch (error: any) {
    console.error("[Postgres] Failed to estimate query cost:", error.message);
    return { estimatedRows: 0, estimatedCost: "unknown" };
  } finally {
    client.release();
  }
}

/**
 * Estimate query cost for PostgreSQL
 */
export const EstimateCost = tool({
  description:
    "Estimate performance cost for PostgreSQL query; returns simplified cost estimate.",
  inputSchema: z.object({
    sql: z.string().min(1),
  }),
  execute: async ({ sql }) => {
    const estimate = await estimateQueryCost(sql);
    return {
      score: 25,
      estimatedRows: estimate.estimatedRows,
      cost: estimate.estimatedCost,
      notes: ["PostgreSQL EXPLAIN estimate"],
    };
  },
});

/**
 * Execute SQL query against PostgreSQL database
 */
export const ExecuteSQL = tool({
  description:
    "Execute read-only SQL query against PostgreSQL database. Returns rows and columns.",
  inputSchema: z.object({
    sql: z.string().min(1),
    queryTag: z.string().optional(),
  }),
  execute: async ({ sql, queryTag }) => {
    console.log(`[ExecuteSQL] Executing: ${sql.substring(0, 100)}...`);
    if (queryTag) {
      console.log(`[ExecuteSQL] Query tag: ${queryTag}`);
    }

    try {
      const result = await executeSQL(sql);

      const columns = result.columns.map((col) => ({
        name: col,
        type: "TEXT",
      }));

      return {
        rows: result.rows,
        columns,
        rowCount: result.rowCount,
        executionTime: result.executionTime,
      };
    } catch (error: any) {
      console.error(`[ExecuteSQL] Error:`, error.message);
      return {
        ok: false,
        error: error.message,
        rows: [],
        columns: [],
      };
    }
  },
});

/**
 * Execute SQL with automatic repair on errors
 */
export const ExecuteSQLWithRepair = tool({
  description:
    "Execute SQL with up to two auto-repair attempts for missing/ambiguous columns.",
  inputSchema: z.object({
    sql: z.string().min(1),
    plan: z.any(), // expect FinalizedPlan
    queryTag: z.string().optional(),
  }),
  execute: async ({ sql, plan, queryTag }) => {
    console.log("[ExecuteSQLWithRepair] Starting execution...");
    console.log(sql);

    // Clean expired cache entries periodically
    cleanExpiredCache();

    // Check cache
    const cacheKey = sql;
    if (queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey)!;
      const age = Date.now() - cached.cachedAt;

      if (age < CACHE_MAX_AGE_MS) {
        console.log(
          `[ExecuteSQLWithRepair] Cache hit! Age: ${Math.round(age / 1000)}s`
        );
        return {
          rows: cached.rows,
          columns: cached.columns,
          attemptedSql: sql,
          repaired: false,
          repairReason: null,
          fromCache: true,
        };
      } else {
        queryCache.delete(cacheKey);
        console.log("[ExecuteSQLWithRepair] Cache entry expired");
      }
    }

    const p = plan as FinalizedPlan;
    const entityLoader = async (name: string) =>
      (await loadEntityYaml(name)).entity;

    const tryExec = async (candidateSql: string) => {
      const result = await executeSQL(candidateSql);
      return {
        rows: result.rows,
        columns: result.columns.map((col) => ({ name: col, type: "TEXT" })),
        rowCount: result.rowCount,
        executionTime: result.executionTime,
      };
    };

    // Attempt #0: original SQL
    try {
      console.log("[ExecuteSQLWithRepair] Attempting original SQL...");
      const res = await tryExec(sql);
      console.log(
        "[ExecuteSQLWithRepair] Success! Rows returned:",
        res.rows.length
      );

      // Cache the result
      queryCache.set(cacheKey, {
        rows: res.rows,
        columns: res.columns,
        cachedAt: Date.now(),
      });
      console.log("[ExecuteSQLWithRepair] Result cached");

      return { ...res, attemptedSql: sql, repaired: false, repairReason: null };
    } catch (err0: any) {
      console.error(
        "[ExecuteSQLWithRepair] Original SQL failed:",
        err0.message
      );

      // Attempt #1: repair
      const r1 = await attemptRepair(sql, p, entityLoader, err0);
      if (!r1?.fixedSql) {
        return {
          ok: false,
          error: String(err0?.message ?? err0),
          attemptedSql: sql,
          repaired: false,
        };
      }

      try {
        const res1 = await tryExec(r1.fixedSql);

        // Cache under original SQL
        queryCache.set(cacheKey, {
          rows: res1.rows,
          columns: res1.columns,
          cachedAt: Date.now(),
        });
        console.log("[ExecuteSQLWithRepair] Repaired result cached");

        return {
          ...res1,
          attemptedSql: r1.fixedSql,
          repaired: true,
          repairReason: r1.reason,
        };
      } catch (err1: any) {
        // Attempt #2: repair again
        const r2 = await attemptRepair(r1.fixedSql, p, entityLoader, err1);
        if (!r2?.fixedSql) {
          return {
            ok: false,
            error: String(err1?.message ?? err1),
            attemptedSql: r1.fixedSql,
            repaired: true,
            repairReason: r1.reason,
          };
        }

        try {
          const res2 = await tryExec(r2.fixedSql);

          queryCache.set(cacheKey, {
            rows: res2.rows,
            columns: res2.columns,
            cachedAt: Date.now(),
          });
          console.log("[ExecuteSQLWithRepair] Second repair result cached");

          return {
            ...res2,
            attemptedSql: r2.fixedSql,
            repaired: true,
            repairReason: r2.reason,
          };
        } catch (err2: any) {
          return {
            ok: false,
            error: String(err2?.message ?? err2),
            attemptedSql: r2.fixedSql,
            repaired: true,
            repairReason: r2.reason,
          };
        }
      }
    }
  },
});
