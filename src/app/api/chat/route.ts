// app/api/agent/route.ts

export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { runAgent } from "@/lib/agent";
import type { UIMessage } from "ai";

const ALLOWED_PART_TYPES = new Set(["text"]);

function sanitizeMessages(messages: any[]): UIMessage[] {
  return (messages ?? []).map((m) => {
    const content =
      Array.isArray(m.content) && m.content.length > 0
        ? m.content.filter((p: any) => ALLOWED_PART_TYPES.has(p?.type))
        : m.content;

    const parts =
      Array.isArray(m.parts) && m.parts.length > 0
        ? m.parts.filter((p: any) => ALLOWED_PART_TYPES.has(p?.type))
        : m.parts;

    return { ...m, content, parts };
  });
}

type Phase = "planning" | "building" | "execution" | "reporting";

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    const sanitized = sanitizeMessages(messages);
    const result = await runAgent({ messages: sanitized, model });

    return result.toUIMessageStreamResponse();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
