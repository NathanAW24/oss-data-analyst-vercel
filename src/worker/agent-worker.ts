import dotenv from "dotenv";
import type { ConsumeMessage } from "amqplib";
import type { UIMessage } from "ai";
import { isAbortError } from "@ai-sdk/provider-utils";
const localEnvResult = dotenv.config({ path: ".env.local" });
dotenv.config();

console.log(`RABBITMQ_URL ${process.env.RABBITMQ_URL}`);

const debug = (...args: unknown[]) => {
  console.log("[worker]", ...args);
};
const debugError = (...args: unknown[]) => {
  console.error("[worker]", ...args);
};

const localEnvKeys = Object.keys(localEnvResult.parsed ?? {}).sort();
// console.log("Worker environment variables (.env.local):");
// if (localEnvKeys.length === 0) {
//   console.log("(none found)");
// } else {
//   localEnvKeys.forEach((key) => {
//     console.log(`${key}=${process.env[key] ?? ""}`);
//   });
// }

type JobPayload = {
  jobId: string;
  messages: UIMessage[];
  model?: string;
};

type CancelPayload = {
  jobId: string;
  reason?: string;
  requestedAt?: string;
};

const isJobPayload = (value: unknown): value is JobPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.jobId === "string" &&
    Array.isArray(record.messages) &&
    (record.model === undefined || typeof record.model === "string")
  );
};

const isCancelPayload = (value: unknown): value is CancelPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.jobId === "string" &&
    (record.reason === undefined || typeof record.reason === "string") &&
    (record.requestedAt === undefined ||
      typeof record.requestedAt === "string")
  );
};

const startWorker = async () => {
  const { runAgent } = await import("../lib/agent");
  const {
    assertRabbitMQTopology,
    getEventsRoutingKey,
    getRabbitMQConfig,
    getRabbitMQConnection,
  } = await import("../lib/rabbitmq");

  const config = getRabbitMQConfig();
  const connection = await getRabbitMQConnection(config);
  const channel = await connection.createChannel();

  await assertRabbitMQTopology(channel, config);
  await channel.prefetch(1);

  debug("worker.ready", {
    jobsQueue: config.jobsQueue,
    jobsExchange: config.jobsExchange,
    eventsExchange: config.eventsExchange,
  });

  const canceledJobIds = new Map<string, number>();
  const CANCEL_TTL_MS = 10 * 60 * 1000;
  let currentJobId: string | null = null;
  let currentAbortController: AbortController | null = null;

  const pruneCanceledJobs = () => {
    const now = Date.now();
    for (const [jobId, ts] of canceledJobIds.entries()) {
      if (now - ts > CANCEL_TTL_MS) {
        canceledJobIds.delete(jobId);
      }
    }
  };

  const markCanceled = (jobId: string) => {
    canceledJobIds.set(jobId, Date.now());
    pruneCanceledJobs();
  };

  const isCanceled = (jobId: string) => {
    const ts = canceledJobIds.get(jobId);
    if (!ts) {
      return false;
    }

    if (Date.now() - ts > CANCEL_TTL_MS) {
      canceledJobIds.delete(jobId);
      return false;
    }

    return true;
  };

  const handleCancel = (payload: CancelPayload) => {
    markCanceled(payload.jobId);
    if (currentJobId === payload.jobId && currentAbortController) {
      debug("job.cancel.requested", {
        jobId: payload.jobId,
        reason: payload.reason,
      });
      currentAbortController.abort();
    } else {
      debug("job.cancel.queued", {
        jobId: payload.jobId,
        reason: payload.reason,
      });
    }
  };

  const publishError = async (jobId: string, error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const routingKey = getEventsRoutingKey(config, jobId);
    channel.publish(config.eventsExchange, routingKey, Buffer.from(errorMessage), {
      type: "error",
    });
    debugError("job.error", { jobId, error: errorMessage });
  };

  const publishDone = async (jobId: string) => {
    const routingKey = getEventsRoutingKey(config, jobId);
    channel.publish(config.eventsExchange, routingKey, Buffer.alloc(0), {
      type: "done",
    });
    debug("job.done", { jobId });
  };

  const publishStream = async (
    jobId: string,
    stream: ReadableStream<Uint8Array>,
    abortSignal?: AbortSignal
  ) => {
    const routingKey = getEventsRoutingKey(config, jobId);
    const reader = stream.getReader();
    const handleAbort = () => {
      void reader.cancel().catch(() => undefined);
    };

    if (abortSignal) {
      abortSignal.addEventListener("abort", handleAbort, { once: true });
    }

    try {
      while (true) {
        if (abortSignal?.aborted) {
          break;
        }

        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        if (value) {
          channel.publish(
            config.eventsExchange,
            routingKey,
            Buffer.from(value),
            { type: "chunk" }
          );
        }
      }
    } finally {
      if (abortSignal) {
        abortSignal.removeEventListener("abort", handleAbort);
      }
    }
  };

  const handleMessage = async (msg: ConsumeMessage | null) => {
    if (!msg) {
      return;
    }

    let payload: JobPayload;

    try {
      const parsed = JSON.parse(msg.content.toString("utf-8")) as unknown;
      if (!isJobPayload(parsed)) {
        console.error("Invalid job payload shape");
        channel.ack(msg);
        return;
      }

      payload = parsed;
    } catch (error) {
      console.error("Invalid job payload", error);
      channel.ack(msg);
      return;
    }

    try {
      if (isCanceled(payload.jobId)) {
        debug("job.skip.canceled", { jobId: payload.jobId });
        canceledJobIds.delete(payload.jobId);
        channel.ack(msg);
        return;
      }

      const abortController = new AbortController();
      currentJobId = payload.jobId;
      currentAbortController = abortController;

      if (isCanceled(payload.jobId)) {
        abortController.abort();
      }

      debug("job.start", { jobId: payload.jobId });
      const result = await runAgent({
        messages: payload.messages,
        model: payload.model,
        abortSignal: abortController.signal,
      });

      const response = result.toUIMessageStreamResponse();
      if (!response.body) {
        throw new Error("Missing response body");
      }

      await publishStream(payload.jobId, response.body, abortController.signal);

      if (abortController.signal.aborted) {
        debug("job.cancelled", { jobId: payload.jobId });
        return;
      }

      await publishDone(payload.jobId);
    } catch (error) {
      if (isAbortError(error) || currentAbortController?.signal.aborted) {
        debug("job.cancelled", { jobId: payload.jobId });
      } else {
        await publishError(payload.jobId, error);
      }
    } finally {
      currentJobId = null;
      currentAbortController = null;
      canceledJobIds.delete(payload.jobId);
      channel.ack(msg);
      debug("job.ack", { jobId: payload.jobId });
    }
  };

  channel.consume(config.jobsQueue, (msg) => {
    void handleMessage(msg);
  });

  channel.consume(
    config.cancelQueue,
    (msg) => {
      if (!msg) {
        return;
      }

      try {
        const parsed = JSON.parse(msg.content.toString("utf-8")) as unknown;
        if (!isCancelPayload(parsed)) {
          debugError("job.cancel.invalid", { payload: parsed });
          return;
        }

        handleCancel(parsed);
      } catch (error) {
        debugError("job.cancel.invalid", { error });
      }
    },
    { noAck: true }
  );

  const shutdown = async () => {
    await channel.close().catch(() => undefined);
    await connection.close().catch(() => undefined);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startWorker().catch((error) => {
  console.error("Worker failed to start", error);
  process.exit(1);
});
