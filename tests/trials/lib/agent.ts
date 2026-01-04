import { config } from "dotenv";
import type { UIMessage } from "ai";
import { runAgent } from "@/lib/agent";
import { closePool } from "@/lib/postgresql";

config({ path: ".env.local", override: true });
config();

async function run() {
  const messages: UIMessage[] = [
    {
      id: "trial-1",
      role: "user",
      parts: [
        {
          type: "text",
          text: "How many companies are in the Technology industry?",
        },
      ],
    },
  ];

  const result = await runAgent({ messages });

  let textOutput = "";
  let finalizeReport: any = null;

  for await (const part of result.fullStream) {
    if (part.type === "text-delta") {
      process.stdout.write(part.text);
      textOutput += part.text;
    }

    if (part.type === "tool-result" && part.toolName === "FinalizeReport") {
      finalizeReport = part.output;
    }

    if (part.type === "tool-error") {
      console.error(
        `\n[ToolError] ${part.toolName}: ${String(part.error ?? "unknown error")}`
      );
    }
  }

  if (!textOutput.trim()) {
    console.log("\n(No assistant text output.)");
  }

  if (finalizeReport) {
    console.log("\n--- FinalizeReport ---");
    console.log(`SQL: ${finalizeReport.sql}`);
    console.log(`Narrative: ${finalizeReport.narrative}`);
    console.log(`Confidence: ${finalizeReport.confidence}`);
    if (Array.isArray(finalizeReport.preview)) {
      console.log(`Preview rows: ${finalizeReport.preview.length}`);
    }
  }
}

async function main() {
  try {
    await run();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
