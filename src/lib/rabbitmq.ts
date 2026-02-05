import amqp, { type Channel, type ChannelModel } from "amqplib";

export type RabbitMQConfig = {
  url: string;
  jobsExchange: string;
  jobsQueue: string;
  eventsExchange: string;
  jobsRoutingKey: string;
  eventsRoutingKeyPrefix: string;
  cancelExchange: string;
  cancelQueue: string;
  cancelRoutingKey: string;
};

type RabbitMQDefaults = Omit<RabbitMQConfig, "url">;

const DEFAULTS: RabbitMQDefaults = {
  jobsExchange: "vercelagent.jobs",
  jobsQueue: "vercelagent.jobs",
  eventsExchange: "vercelagent.events",
  jobsRoutingKey: "vercelagent.run",
  eventsRoutingKeyPrefix: "vercelagent.job.",
  cancelExchange: "vercelagent.cancel",
  cancelQueue: "vercelagent.cancel",
  cancelRoutingKey: "vercelagent.cancel",
};

let connectionPromise: Promise<ChannelModel> | null = null;

export const getRabbitMQConfig = (): RabbitMQConfig => {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error("RABBITMQ_URL is not set");
  }

  return {
    url,
    jobsExchange: process.env.RABBITMQ_JOBS_EXCHANGE || DEFAULTS.jobsExchange,
    jobsQueue: process.env.RABBITMQ_JOBS_QUEUE || DEFAULTS.jobsQueue,
    eventsExchange:
      process.env.RABBITMQ_EVENTS_EXCHANGE || DEFAULTS.eventsExchange,
    jobsRoutingKey:
      process.env.RABBITMQ_JOBS_ROUTING_KEY || DEFAULTS.jobsRoutingKey,
    eventsRoutingKeyPrefix:
      process.env.RABBITMQ_EVENTS_ROUTING_KEY_PREFIX ||
      DEFAULTS.eventsRoutingKeyPrefix,
    cancelExchange:
      process.env.RABBITMQ_CANCEL_EXCHANGE || DEFAULTS.cancelExchange,
    cancelQueue: process.env.RABBITMQ_CANCEL_QUEUE || DEFAULTS.cancelQueue,
    cancelRoutingKey:
      process.env.RABBITMQ_CANCEL_ROUTING_KEY || DEFAULTS.cancelRoutingKey,
  };
};

export const getEventsRoutingKey = (config: RabbitMQConfig, jobId: string) =>
  `${config.eventsRoutingKeyPrefix}${jobId}`;

export const getEventsQueueName = (jobId: string) => `agent.events.${jobId}`;

export const getRabbitMQConnection = async (
  config: RabbitMQConfig
): Promise<ChannelModel> => {
  if (connectionPromise) {
    return connectionPromise;
  }

  const promise = amqp.connect(config.url);
  connectionPromise = promise;

  promise
    .then((connection) => {
      connection.on("close", () => {
        connectionPromise = null;
      });

      connection.on("error", () => {
        connectionPromise = null;
      });
    })
    .catch(() => {
      connectionPromise = null;
    });

  return promise;
};

export const createRabbitMQChannel = async (
  config: RabbitMQConfig
): Promise<Channel> => {
  const connection = await getRabbitMQConnection(config);
  return connection.createChannel();
};

export const assertRabbitMQTopology = async (
  channel: Channel,
  config: RabbitMQConfig
) => {
  await channel.assertExchange(config.jobsExchange, "direct", {
    durable: true,
  });

  await channel.assertExchange(config.eventsExchange, "topic", {
    durable: true,
  });

  await channel.assertExchange(config.cancelExchange, "direct", {
    durable: true,
  });

  await channel.assertQueue(config.jobsQueue, {
    durable: true,
    arguments: {
      "x-single-active-consumer": true,
    },
  });

  await channel.assertQueue(config.cancelQueue, {
    durable: false,
    autoDelete: false,
  });

  await channel.bindQueue(
    config.jobsQueue,
    config.jobsExchange,
    config.jobsRoutingKey
  );

  await channel.bindQueue(
    config.cancelQueue,
    config.cancelExchange,
    config.cancelRoutingKey
  );
};
