# RabbitMQ Docs
## RabbitMQ AMQP URL quick notes

AMQP URL format
```text
amqp://user:pass@host:5672/vhost
```

What `@` means
- The `@` separates credentials from the host.
- Everything before `@` is username and password (`user:pass`).
- Everything after `@` is the host (and optional port).
- If your username or password contains special characters, URL-encode them.
  Example: password `pa@ss` becomes `pa%40ss`.

What is a vhost
- A vhost (virtual host) is a namespace inside RabbitMQ that isolates queues,
  exchanges, bindings, and permissions.
- The vhost is the path portion of the URL.

Common vhost cases
- Default vhost is `/` and must be URL-encoded as `%2F`:
  ```text
  amqp://user:pass@host:5672/%2F
  ```
- Example custom vhost `myapp`:
  ```text
  amqp://user:pass@host:5672/myapp
  ```

CLI test (direct AMQP) with `amqp-tools`
1) Install (Debian/Ubuntu):
   ```bash
   sudo apt-get install amqp-tools
   ```
2) Test round-trip:
   ```bash
   export AMQP_URL="amqp://user:pass@host:5672/vhost"

   amqp-declare-queue -u "$AMQP_URL" -q test-cli
   amqp-publish -u "$AMQP_URL" -r test-cli -b "hello"
   # NOTE: Some amqp-tools builds require a consume command.
   # Use `cat` to print the message body:
   amqp-consume -u "$AMQP_URL" -q test-cli -c 1 -- cat
   # Alternatively, use amqp-get (no command needed):
   # amqp-get -u "$AMQP_URL" -q test-cli
   ```

If `amqp-consume` prints `hello`, the URL works.

CLI test (management HTTP API) with `rabbitmqadmin`
Note: This uses the HTTP management plugin, not AMQP.
1) Enable the management plugin on the server.
2) Download rabbitmqadmin from the management UI.
3) Test:
   ```bash
   rabbitmqadmin -u user -p pass -H host -P 15672 list vhosts
   ```

## Basic Concept Quickstart

Basic RabbitMQ concepts for long-running jobs
- Broker: the RabbitMQ server that routes and stores messages.
- Vhost: namespace that isolates queues/exchanges/users.
- Connection/Channel: one TCP connection with lightweight channels.
- Exchange: routes messages to queues (direct/topic/fanout/headers).
- Queue: holds messages until consumers handle them.
- Binding/Routing key: rules connecting exchanges to queues.
- Producer/Consumer: sender and worker.
- Ack/Nack: signal success/failure; enables retries.

Work-queue patterns (long-running tasks)
- Competing consumers: many workers consume from the same queue to scale.
- Manual ack: only ack after the job finishes.
- Prefetch (QoS): limit in-flight messages per worker (often 1).
- Idempotency: handlers should be safe to retry.
- Durability: durable queues + persistent messages; consider publisher confirms.

Retries, delays, and failures
- Dead-letter exchange (DLX): route failed/expired messages to a DLQ.
- Retry with backoff: TTL + DLX "delay queues" per attempt.
- Poison messages: after N retries, park in a quarantine queue.
- Timeouts: avoid stuck jobs; consider consumer-side timeouts.

Scheduling "run later"
- External scheduler publishes messages at the right time (cron, etc.).
- Delay pattern: TTL + DLX requeue after a delay.
- Optional delayed-message plugin if enabled in your infra.
