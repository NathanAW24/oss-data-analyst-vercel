import { tool } from "ai";
import { z } from "zod";
import { executeSQL } from "@/lib/postgres";
import type { FinalizedPlan } from "@/lib/planning/types";
import { loadEntityYaml } from "@/lib/semantic/io";
import { attemptRepair } from "@/lib/execute/repair";

export const EstimateCost = tool({
  description: "Estimate cost for a Postgres query (simple heuristic).",
  inputSchema: z.object({
    sql: z.string().min(1),
  }),
  execute: async () => {
    // Placeholder heuristic; extend with EXPLAIN if needed
    return {
      score: 50,
      estimatedRows: null,
      cost: "unknown",
      notes: ["Simple heuristic for Postgres; consider adding EXPLAIN support."],
    };
  },
});

export const ExecuteSQL = tool({
  description: "Execute read-only SQL against Postgres.",
  inputSchema: z.object({
    sql: z.string().min(1),
    queryTag: z.string().optional(),
  }),
  execute: async ({ sql }) => {
    const res = await executeSQL(sql);
    return res;
  },
});

export const ExecuteSQLWithRepair = tool({
  description:
    "Execute SQL against Postgres with a single auto-repair attempt for missing/ambiguous columns.",
  inputSchema: z.object({
    sql: z.string().min(1),
    plan: z.any(), // expect FinalizedPlan
    queryTag: z.string().optional(),
  }),
  execute: async ({ sql, plan }) => {
    const p = plan as FinalizedPlan;
    const entityLoader = async (name: string) =>
      (await loadEntityYaml(name)).entity;

    try {
      const res = await executeSQL(sql);
      return { ...res, attemptedSql: sql, repaired: false };
    } catch (err0: any) {
      const repair = await attemptRepair(sql, p, entityLoader, err0);
      if (!repair?.fixedSql) {
        throw err0;
      }
      const res = await executeSQL(repair.fixedSql);
      return {
        ...res,
        attemptedSql: repair.fixedSql,
        repaired: true,
        repairReason: repair.reason ?? err0.message,
      };
    }
  },
});
