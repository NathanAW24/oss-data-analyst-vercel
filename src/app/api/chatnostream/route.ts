export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { extractFinalizeReport, runNonStreamingAgent } from "@/lib/agent";

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();
    const result = await runNonStreamingAgent({ messages, model });
    const finalResult = extractFinalizeReport(result);

    if (!finalResult.hasFinalResult) {
      return new Response(
        JSON.stringify({
          hasFinalResult: false,
          error: "FinalizeReport not found in agent output.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(finalResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
