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

## Local Docker Setup

1) Start RabbitMQ (with management UI) locally:
   ```bash
   docker run -d --rm --name rabbitmq \
     -p 5672:5672 -p 15672:15672 \
     -e RABBITMQ_DEFAULT_USER=user \
     -e RABBITMQ_DEFAULT_PASS=pass \
     -e RABBITMQ_DEFAULT_VHOST=oss-data-analyst \
     rabbitmq:3-management
   ```

2) Use this AMQP URL locally:
   ```text
   amqp://user:pass@localhost:5672/oss-data-analyst
   ```

Management UI: `http://localhost:15672` (user `user`, pass `pass`).

### Stop / Restart (fresh container)

If you see `container name "/rabbitmq" is already in use`, stop and remove
the previous container before starting a new one:

```bash
docker rm -f rabbitmq
```

Then run the `docker run ...` command above again.



## CLI test (direct AMQP) with `amqp-tools`
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

## Project-Specific Exchanges, Queues, and Routing Keys

This project uses two exchanges and two queue patterns to separate **durable job scheduling**
from **ephemeral streaming events**. The names here reflect the defaults in `src/lib/rabbitmq.ts`.

Key objects
- Exchange (jobs): `vercelagent.jobs` (direct, durable)
- Queue (jobs): `vercelagent.jobs` (durable)
- Exchange (events): `vercelagent.events` (topic, durable)
- Queue (events per job): `agent.events.<jobId>` (non-durable, created per request)
- Jobs routing key: `vercelagent.run`
- Events routing key prefix: `vercelagent.job.`

Important clarifications
- The **jobs exchange and jobs queue share the same name** (`vercelagent.jobs`), but they are
  **different objects**. Messages still flow exchange → queue via a binding.
- The events queue is **not a default queue**. It is explicitly created per job and deleted
  on `done`/`error`.
- If 10 concurrent streams exist, there are 10 event queues: `agent.events.<jobId>` for each job.

Why two exchange types
- Jobs use a **direct** exchange because all jobs use one fixed routing key.
- Events use a **topic** exchange because routing keys are per-job and topic binding lets each
  job’s queue receive only its own events.

### Visualization: API → Worker (Jobs)
```text
API
  |
  | publish job (routing key: vercelagent.run)
  v
[exchange: vercelagent.jobs]  (direct)
  |
  | binding: vercelagent.run
  v
[queue: vercelagent.jobs]  (durable)
  |
  v
Worker consumes, processes, acks
```

### Visualization: Worker → API (Events)
```text
Worker
  |
  | publish event (routing key: vercelagent.job.<jobId>)
  v
[exchange: vercelagent.events]  (topic)
  |
  | binding: vercelagent.job.<jobId>
  v
[queue: agent.events.<jobId>]  (per-job, non-durable)
  |
  v
API consumes, streams to client, deletes queue on done/error
```

### End-to-End Flow Summary
1. API asserts exchanges + jobs queue and binds `vercelagent.run`.
2. API creates a per-job events queue `agent.events.<jobId>` and binds it to
   `vercelagent.events` with routing key `vercelagent.job.<jobId>`.
3. API publishes the job to `vercelagent.jobs` with routing key `vercelagent.run`.
4. Worker consumes from `vercelagent.jobs`, runs the job, and publishes `chunk`/`done`/`error`
   events to `vercelagent.events` using routing key `vercelagent.job.<jobId>`.
5. API consumes those events from the per-job queue and streams them to the client, then deletes
   the events queue.
