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

const UI_MESSAGE_STREAM_HEADERS = {
  "content-type": "text/event-stream",
  "cache-control": "no-cache",
  connection: "keep-alive",
  "x-vercel-ai-ui-message-stream": "v1",
  "x-accel-buffering": "no",
};

export async function POST(req: NextRequest) {
  let channel: Channel | null = null;
  let eventsQueueNameRef: string | null = null;
  let consumerTag: string | null = null;

  try {
    const { messages, model } = await req.json();

    const config = getRabbitMQConfig();
    channel = await createRabbitMQChannel(config);
    await assertRabbitMQTopology(channel, config);

    const jobId = randomUUID();
    const eventsRoutingKey = getEventsRoutingKey(config, jobId);
    const eventsQueueName = getEventsQueueName(jobId);
    eventsQueueNameRef = eventsQueueName;

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
    };

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const onMessage = (msg: ConsumeMessage | null) => {
          if (!msg) {
            return;
          }

          const messageType = msg.properties.type;

          if (messageType === "done") {
            controller.close();
            void cleanup();
            return;
          }

          if (messageType === "error") {
            const errorText = msg.content.toString("utf-8");
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
            controller.error(err);
            void cleanup();
          });
      },
      cancel() {
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
    return new Response(JSON.stringify({ ok: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
