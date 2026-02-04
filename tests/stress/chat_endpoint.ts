/**
 * Stress test the chat endpoint with concurrent requests.
 *
 * Usage:
 *   pnpm tsx tests/stress/chat_endpoint.ts
 *   pnpm tsx tests/stress/chat_endpoint.ts 25
 *
 * Optional env:
 *   CHAT_ENDPOINT_URL=http://localhost:3000/api/chat
 *   NEXT_PUBLIC_API_URL=http://localhost:3000
 *   CHAT_MODEL=openai/gpt-5
 *   CHAT_HEADERS_TIMEOUT_MS=600000
 *   CHAT_BODY_TIMEOUT_MS=0
 */
import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { Agent } from "undici";

const DEFAULT_COUNT = 10;
const DEFAULT_MODEL = "openai/gpt-5";
const DEFAULT_URL = "http://localhost:3000/api/chat";
const DEFAULT_HEADERS_TIMEOUT_MS = 10 * 60 * 100000;
const DEFAULT_BODY_TIMEOUT_MS = 0;
const QUESTION_POOL = [
  // "For hostname XAPL190221, fetch Redfish endpoints and PSU power telemetry for the last 2 hours, list ServiceNow alerts in the last 7 days, and propose a cabinet placement in SgpDC for two 2U servers at 500W each with rationale.",
  // "Compare row-level capacity and power headroom for SgpDC and XAP, include any alert targets affecting placement, and recommend the best row and cabinet to place four new 2U servers at 600W each (single or split rows acceptable).",
  // "For incident INC1265608, list ServiceNow alerts, correlate with Redfish telemetry for the affected host over the last 6 hours (fans and PSU), and advise whether relocating the workload to another cabinet in SgpDC is needed; include the target cabinet choice.",
  // "Pull Redfish fan and power telemetry for SGPRHVH4-SDE004 over the last 4 hours, check for any ServiceNow alerts in that window, and provide a remediation plan plus whether additional capacity is available in its row for adding a 4U/700W server.",
  "Summarize cabinet-level capacity and power headroom for data center XAP.",
  "Summarize row-level capacity for SgpDC including power utilization.",
  "Recommend placement for 3 servers (4U each, 450W each) in data center XAP",
  "Find the best cabinet in SgpDC for two 2U servers at 500W each.",
  "Find Redfish endpoints and identity for host XAPL190221.",
  "Lookup the Action Redfish endpoints details for server XAPL190221, as i want to trigger API call to the Action Redfish URL",
  "Pull PSU power redfish telemetry for XAP-TSESESX11 for the last 2 hours and include a summary.",
  "Show fan redfish telemetry for SGPRHVH4-SDE004 from 2026-01-01T00:00Z to 2026-01-01T06:00Z.",
  "Show ServiceNow alerts severity critical for device label XAPL190008 in the last week.",
  "List ServiceNow alerts for incident number INC1265608.",
];

type RunResult = {
  ok: boolean;
  status: number | null;
  durationMs: number;
  bytes: number;
  outputTail: string;
  logPath: string;
  error?: string;
};

const formatError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const base = `${error.name}: ${error.message}`.trim();
  const cause = (error as { cause?: unknown }).cause;

  if (!cause) {
    return base;
  }

  if (cause instanceof Error) {
    const code = (cause as { code?: string }).code;
    const codePart = code ? ` (${code})` : "";
    return `${base} | cause=${cause.name}${codePart}: ${cause.message}`;
  }

  return `${base} | cause=${String(cause)}`;
};

const parseCount = (raw: string | undefined) => {
  if (!raw) {
    return DEFAULT_COUNT;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_COUNT;
  }

  return parsed;
};

const parseTimeoutMs = (raw: string | undefined, fallback: number) => {
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
};

const normalizeBaseUrl = (baseUrl: string) =>
  baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

const dispatcher = new Agent({
  headersTimeout: parseTimeoutMs(
    process.env.CHAT_HEADERS_TIMEOUT_MS,
    DEFAULT_HEADERS_TIMEOUT_MS
  ),
  bodyTimeout: parseTimeoutMs(
    process.env.CHAT_BODY_TIMEOUT_MS,
    DEFAULT_BODY_TIMEOUT_MS
  ),
});

const resolveUrl = () => {
  if (process.env.CHAT_ENDPOINT_URL) {
    return process.env.CHAT_ENDPOINT_URL;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)}/api/chat`;
  }

  return DEFAULT_URL;
};

const pickQuestion = () =>
  QUESTION_POOL[Math.floor(Math.random() * QUESTION_POOL.length)];

const runRequest = async (
  url: string,
  index: number,
  outputDir: string
): Promise<RunResult> => {
  const startedAt = Date.now();
  const logPath = path.join(outputDir, `req-${index}.txt`);
  const logStream = createWriteStream(logPath, { flags: "w" });
  const payload = {
    model: process.env.CHAT_MODEL ?? DEFAULT_MODEL,
    messages: [
      {
        id: `stress-${Date.now()}-${index}`,
        role: "user",
        parts: [
          {
            type: "text",
            text: pickQuestion(),
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      dispatcher,
      body: JSON.stringify(payload),
    } as RequestInit);

    if (!response.ok) {
      logStream.write(`HTTP ${response.status}\n`);
      logStream.end();
      return {
        ok: false,
        status: response.status,
        durationMs: Date.now() - startedAt,
        bytes: 0,
        outputTail: "",
        logPath,
        error: `HTTP ${response.status}`,
      };
    }

    if (!response.body) {
      logStream.write("Missing response body\n");
      logStream.end();
      return {
        ok: false,
        status: response.status,
        durationMs: Date.now() - startedAt,
        bytes: 0,
        outputTail: "",
        logPath,
        error: "Missing response body",
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let totalBytes = 0;
    let buffered = "";
    let outputTail = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        totalBytes += value.byteLength;
        const chunkText = decoder.decode(value, { stream: true });
        logStream.write(chunkText);
        buffered += chunkText;

        let newlineIndex = buffered.indexOf("\n");
        while (newlineIndex !== -1) {
          const line = buffered.slice(0, newlineIndex).trim();
          if (line.length > 0) {
            outputTail = line;
          }
          buffered = buffered.slice(newlineIndex + 1);
          newlineIndex = buffered.indexOf("\n");
        }
      }
    }

    const remaining = decoder.decode();
    if (remaining) {
      logStream.write(remaining);
      buffered += remaining;
    }

    if (buffered.trim().length > 0) {
      outputTail = buffered.trim();
    }

    logStream.end();
    return {
      ok: true,
      status: response.status,
      durationMs: Date.now() - startedAt,
      bytes: totalBytes,
      outputTail,
      logPath,
    };
  } catch (error) {
    const errorMessage = formatError(error);
    logStream.write(`Error: ${errorMessage}\n`);
    logStream.end();
    return {
      ok: false,
      status: null,
      durationMs: Date.now() - startedAt,
      bytes: 0,
      outputTail: "",
      logPath,
      error: errorMessage,
    };
  }
};

const summarize = async (results: RunResult[], outputDir: string) => {
  const okResults = results.filter((result) => result.ok);
  const failedResults = results.filter((result) => !result.ok);

  const totalDuration = results.reduce(
    (sum, result) => sum + result.durationMs,
    0
  );
  const totalBytes = results.reduce((sum, result) => sum + result.bytes, 0);

  const avgDuration = results.length ? totalDuration / results.length : 0;
  const avgBytes = results.length ? totalBytes / results.length : 0;

  console.log("\nStress test summary:");
  console.log(`Total requests: ${results.length}`);
  console.log(`Succeeded: ${okResults.length}`);
  console.log(`Failed: ${failedResults.length}`);
  console.log(`Average duration: ${avgDuration.toFixed(2)} ms`);
  console.log(`Average bytes: ${avgBytes.toFixed(2)} bytes`);

  if (failedResults.length > 0) {
    console.log("\nFailures:");
    failedResults.forEach((result, index) => {
      console.log(
        `#${index + 1}: status=${result.status ?? "n/a"} error=${
          result.error ?? "unknown"
        }`
      );
    });
  }

  const summaryLines: string[] = [];
  summaryLines.push("Stress test summary");
  summaryLines.push(`Total requests: ${results.length}`);
  summaryLines.push(`Succeeded: ${okResults.length}`);
  summaryLines.push(`Failed: ${failedResults.length}`);
  summaryLines.push(`Average duration: ${avgDuration.toFixed(2)} ms`);
  summaryLines.push(`Average bytes: ${avgBytes.toFixed(2)} bytes`);
  summaryLines.push("");
  summaryLines.push("Per-request results:");
  results.forEach((result, index) => {
    const lineParts = [
      `#${index + 1}`,
      result.ok ? "ok" : "failed",
      `status=${result.status ?? "n/a"}`,
      `durationMs=${result.durationMs}`,
      `bytes=${result.bytes}`,
      `log=${result.logPath}`,
    ];

    if (result.outputTail) {
      lineParts.push(`finalOutput=${result.outputTail}`);
    }

    if (result.error) {
      lineParts.push(`error=${result.error}`);
    }

    summaryLines.push(lineParts.join(" | "));
  });

  await fs.writeFile(
    path.join(outputDir, "summary.txt"),
    summaryLines.join("\n"),
    "utf-8"
  );
};

const main = async () => {
  const count = parseCount(process.argv[2]);
  const url = resolveUrl();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = path.join(
    "tests",
    "stress",
    "chat_endpoint_results",
    timestamp
  );
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`Stress testing ${url}`);
  console.log(`Concurrent requests: ${count}`);
  console.log(`Results directory: ${outputDir}`);

  const tasks = Array.from({ length: count }, (_, index) =>
    runRequest(url, index + 1, outputDir)
  );

  const results = await Promise.all(tasks);

  results.forEach((result, index) => {
    const label = `Request #${index + 1}`;
    if (result.ok) {
      console.log(
        `${label}: ok (${result.status}) ${result.durationMs}ms ${result.bytes} bytes`
      );
    } else {
      console.log(
        `${label}: failed (${result.status ?? "n/a"}) ${
          result.durationMs
        }ms ${result.error ?? "unknown error"}`
      );
    }
  });

  await summarize(results, outputDir);
};

void main();
