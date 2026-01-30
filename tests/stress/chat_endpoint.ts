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
 */
import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_COUNT = 15;
const DEFAULT_MODEL = "openai/gpt-5";
const DEFAULT_URL = "http://localhost:3000/api/chat";

type RunResult = {
  ok: boolean;
  status: number | null;
  durationMs: number;
  bytes: number;
  outputTail: string;
  logPath: string;
  error?: string;
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

const normalizeBaseUrl = (baseUrl: string) =>
  baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

const resolveUrl = () => {
  if (process.env.CHAT_ENDPOINT_URL) {
    return process.env.CHAT_ENDPOINT_URL;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)}/api/chat`;
  }

  return DEFAULT_URL;
};

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
            text: `Stress test request ${index} at ${new Date().toISOString()}`,
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
      body: JSON.stringify(payload),
    });

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
    const errorMessage = error instanceof Error ? error.message : String(error);
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
