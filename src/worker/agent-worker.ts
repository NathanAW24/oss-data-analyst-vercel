import dotenv from "dotenv";
import type { ConsumeMessage } from "amqplib";
import type { UIMessage } from "ai";
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
    stream: ReadableStream<Uint8Array>
  ) => {
    const routingKey = getEventsRoutingKey(config, jobId);
    const reader = stream.getReader();

    while (true) {
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
      debug("job.start", { jobId: payload.jobId });
      const result = await runAgent({
        messages: payload.messages,
        model: payload.model,
      });

      const response = result.toUIMessageStreamResponse();
      if (!response.body) {
        throw new Error("Missing response body");
      }

      await publishStream(payload.jobId, response.body);
      await publishDone(payload.jobId);
    } catch (error) {
      await publishError(payload.jobId, error);
    } finally {
      channel.ack(msg);
      debug("job.ack", { jobId: payload.jobId });
    }
  };

  channel.consume(config.jobsQueue, (msg) => {
    void handleMessage(msg);
  });

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
