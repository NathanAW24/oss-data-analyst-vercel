import {
  parseJsonEventStream,
  readUIMessageStream,
  uiMessageChunkSchema,
  type UIMessage,
} from "ai";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";

const apiUrl = process.env.CHAT_API_URL ?? "http://localhost:3000/api/chat";
const model = process.env.CHAT_MODEL ?? "anthropic/claude-opus-4.5";
const webSearch = process.env.CHAT_WEB_SEARCH === "true";
const outputPath = process.env.CHAT_OUTPUT_PATH ?? "trial/query-results.json";

// "Summarize cabinet-level capacity and power headroom for data center XAP.",
// "Summarize row-level capacity for SgpDC including power utilization.",
// "Recommend placement for 3 servers (4U each, 450W each) in data center XAP",
// "Find the best cabinet in SgpDC for two 2U servers at 500W each.",
// "Find Redfish endpoints and identity for host XAPL190221.",
// "Lookup the Action Redfish endpoints details for server XAPL190221, as i want to trigger API call to the Action Redfish URL",
// "Pull PSU power redfish telemetry for XAP-TSESESX11 for the last 2 hours and include a summary.",
// "Show fan redfish telemetry for SGPRHVH4-SDE004 from 2026-01-01T00:00Z to 2026-01-01T06:00Z.",
// "List alert targets with rules containing 'fan' in SgpDC, limit 20 results.",
// "Show ServiceNow alerts severity critical for device label XAPL190008 in the last week.",
// "List ServiceNow alerts for incident number INC1265608.",
const queries = [
  "For hostname XAPL190221, fetch Redfish endpoints and PSU power telemetry for the last 2 hours, list ServiceNow alerts in the last 7 days, and propose a cabinet placement in SgpDC for two 2U servers at 500W each with rationale.",
  "Compare row-level capacity and power headroom for SgpDC and XAP, include any alert targets affecting placement, and recommend the best row and cabinet to place four new 2U servers at 600W each (single or split rows acceptable).",
  "For incident INC1265608, list ServiceNow alerts, correlate with Redfish telemetry for the affected host over the last 6 hours (fans and PSU), and advise whether relocating the workload to another cabinet in SgpDC is needed; include the target cabinet choice.",
  "Pull Redfish fan and power telemetry for SGPRHVH4-SDE004 over the last 4 hours, check for any ServiceNow alerts in that window, and provide a remediation plan plus whether additional capacity is available in its row for adding a 4U/700W server."
];

type FinalizeReportOutput = {
  narrative?: string;
  sql?: string;
  csvResults?: string;
};

const isFinalizeReportOutput = (
  output: unknown
): output is FinalizeReportOutput =>
  typeof output === "object" &&
  output != null &&
  "narrative" in output &&
  "sql" in output &&
  "csvResults" in output;

const extractNarrative = (message: UIMessage) => {
  const finalizeReportPart = message.parts.find(
    (part) => "output" in part && isFinalizeReportOutput(part.output)
  );

  return finalizeReportPart && "output" in finalizeReportPart
    ? (finalizeReportPart.output as FinalizeReportOutput).narrative
    : undefined;
};

const parseAssistantMessage = async (response: Response): Promise<UIMessage> => {
  if (!response.body) {
    throw new Error("Response body is empty.");
  }

  const chunkStream = parseJsonEventStream({
    stream: response.body,
    schema: uiMessageChunkSchema,
  }).pipeThrough(
    // Match the client transport behavior for UI message streams.
    new TransformStream({
      async transform(chunk, controller) {
        if (!chunk.success) {
          throw chunk.error;
        }
        controller.enqueue(chunk.value);
      },
    })
  );

  let lastMessage: UIMessage | undefined;
  for await (const message of readUIMessageStream({ stream: chunkStream })) {
    lastMessage = message;
  }

  if (!lastMessage) {
    throw new Error("No UI message received from API.");
  }

  return lastMessage;
};

const fetchAssistantMessage = async (question: string): Promise<UIMessage> => {
  const chatId = `chat-${randomUUID()}`;
  const userMessage = {
    id: `msg-${randomUUID()}`,
    role: "user",
    parts: [{ type: "text", text: question }],
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: chatId,
      messages: [userMessage],
      model,
      webSearch,
      trigger: "submit-message",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Request failed (${response.status}): ${errorText || "No error body"}`
    );
  }

  return parseAssistantMessage(response);
};

const main = async () => {
  const results: Array<{ question: string; output: UIMessage | null }> = [];

  for (const question of queries) {
    try {
      const message = await fetchAssistantMessage(question);
      const narrative = extractNarrative(message);
      const indent = results.length === 0 ? "" : "  ";
      const answerText = narrative ?? "";
      console.log(`${indent}questions: "${question}"`);
      console.log(`${indent}answer: "${answerText}"`);
      console.log("");
      results.push({ question, output: message });
    } catch (error) {
      process.exitCode = 1;
      console.error(
        `Error for question "${question}":`,
        error instanceof Error ? error.message : String(error)
      );
      results.push({ question, output: null });
    }
  }

  await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
};

main();
