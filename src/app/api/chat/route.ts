// app/api/agent/route.ts

export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import type { Channel, ConsumeMessage } from "amqplib";
import {
  assertRabbitMQTopology,
  createRabbitMQChannel,
  getEventsQueueName,
  getEventsRoutingKey,
  getRabbitMQConfig,
} from "@/lib/rabbitmq";

const debug = (...args: unknown[]) => {
  console.log("[chat]", ...args);
};
const debugError = (...args: unknown[]) => {
  console.error("[chat]", ...args);
};

const UI_MESSAGE_STREAM_HEADERS = {
  "content-type": "text/event-stream",
  "cache-control": "no-cache",
  connection: "keep-alive",
  "x-vercel-ai-ui-message-stream": "v1",
  "x-accel-buffering": "no",
};

export async function POST(req: NextRequest) {
  console.log(`RABBITMQ_URL ${process.env.RABBITMQ_URL}`);

  let channel: Channel | null = null;
  let eventsQueueNameRef: string | null = null;
  let consumerTag: string | null = null;
  let cancelPublished = false;
  let jobFinished = false;

  try {
    const { messages, model } = await req.json();

    const config = getRabbitMQConfig();
    channel = await createRabbitMQChannel(config);
    await assertRabbitMQTopology(channel, config);

    const jobId = randomUUID();
    const eventsRoutingKey = getEventsRoutingKey(config, jobId);
    const eventsQueueName = getEventsQueueName(jobId);
    eventsQueueNameRef = eventsQueueName;

    debug("job.start", {
      jobId,
      model,
      jobsExchange: config.jobsExchange,
      jobsQueue: config.jobsQueue,
      eventsExchange: config.eventsExchange,
    });

    await channel.assertQueue(eventsQueueName, {
      durable: false,
      autoDelete: false,
    });
    await channel.bindQueue(
      eventsQueueName,
      config.eventsExchange,
      eventsRoutingKey
    );

    const jobPayload = JSON.stringify({ jobId, messages, model });
    channel.publish(
      config.jobsExchange,
      config.jobsRoutingKey,
      Buffer.from(jobPayload),
      { contentType: "application/json", persistent: true }
    );

    debug("job.enqueued", { jobId, routingKey: config.jobsRoutingKey });

    const publishCancel = async (reason: string) => {
      if (!channel || cancelPublished || jobFinished) {
        return;
      }

      cancelPublished = true;
      const payload = JSON.stringify({
        jobId,
        reason,
        requestedAt: new Date().toISOString(),
      });

      channel.publish(
        config.cancelExchange,
        config.cancelRoutingKey,
        Buffer.from(payload),
        { contentType: "application/json" }
      );
      debug("job.cancel.enqueued", { jobId, reason });
    };

    const cleanup = async () => {
      if (!channel) {
        return;
      }

      if (consumerTag) {
        await channel.cancel(consumerTag).catch(() => undefined);
      }

      if (eventsQueueNameRef) {
        await channel.deleteQueue(eventsQueueNameRef).catch(() => undefined);
      }

      await channel.close().catch(() => undefined);
      debug("job.cleanup", { jobId });
    };

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const onMessage = (msg: ConsumeMessage | null) => {
          if (!msg) {
            return;
          }

          const messageType = msg.properties.type;

          if (messageType === "done") {
            debug("job.done", { jobId });
            jobFinished = true;
            controller.close();
            void cleanup();
            return;
          }

          if (messageType === "error") {
            const errorText = msg.content.toString("utf-8");
            debugError("job.error", { jobId, error: errorText });
            jobFinished = true;
            controller.error(new Error(errorText));
            void cleanup();
            return;
          }

          controller.enqueue(msg.content);
        };

        channel
          ?.consume(eventsQueueName, onMessage, { noAck: true })
          .then(({ consumerTag: tag }) => {
            consumerTag = tag;
          })
          .catch((err) => {
            debugError("job.consume.error", { jobId, error: err });
            controller.error(err);
            void cleanup();
          });
      },
      cancel() {
        void publishCancel("client_disconnect");
        void cleanup();
      },
    });

    return new Response(stream, {
      headers: UI_MESSAGE_STREAM_HEADERS,
    });
  } catch (err: unknown) {
    if (channel) {
      await channel.close().catch(() => undefined);
    }

    const errorMessage = err instanceof Error ? err.message : String(err);
    debugError("job.request.error", { error: errorMessage });
    return new Response(JSON.stringify({ ok: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
