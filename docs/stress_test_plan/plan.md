# RabbitMQ runAgent Scheduling Plan

## Goal
Introduce RabbitMQ to schedule `runAgent` as a long-running job while preserving the existing streaming UI behavior. Only one job should be processed at a time. Jobs must be durable. We will decouple execution into a worker process (Option B) and keep the Next.js API as the streaming gateway.

## Summary of Decisions
- Durable jobs: yes (durable queue + persistent messages + ack after completion).
- Single active job: `x-single-active-consumer=true` on the jobs queue + `prefetch(1)` on worker.
- No cancellation (simplest). If the client disconnects, the worker still finishes.
- Streaming preserved: worker forwards chunks to RabbitMQ; API streams them to the client.
- Events queue has no TTL and is deleted explicitly after completion.

## RabbitMQ Topology
- vhost: `oss-data-analyst` (or `/` for dev)
- exchange (jobs): `agent.jobs` (direct, durable)
- queue (jobs): `agent.jobs` (durable)
  - args: `x-single-active-consumer=true`
  - consume with `prefetch(1)`
- exchange (events): `agent.events` (topic, durable)
- queue (events per job): `agent.events.<jobId>` (exclusive or non-durable, no TTL)
  - deleted explicitly on `done` or `error`
- routing keys:
  - job publish: `agent.run`
  - event publish: `job.<jobId>`

## Message Semantics
- Job message body (JSON): `{ jobId, messages, model }`
  - publish with `persistent: true`
- Event message properties:
  - type: `chunk | done | error`
  - `chunk`: raw streaming bytes from `runAgent`
  - `done`: empty body
  - `error`: error string

## Runtime Flow
### API Route (`/api/chat`)
1. Parse request, generate `jobId`.
2. Ensure exchanges/queues exist.
3. Declare `agent.events.<jobId>` queue + bind `job.<jobId>`.
4. Publish job to `agent.jobs` (persistent).
5. Stream HTTP response by consuming events:
   - `chunk` -> `enqueue(msg.content)`
   - `done` -> close stream + delete events queue
   - `error` -> error the stream + delete events queue

### Worker
1. Connect to RabbitMQ; ensure exchanges/queues exist.
2. Consume `agent.jobs` with `prefetch(1)`.
3. For each job:
   - Run `runAgent(...)`.
   - Stream output chunks to `agent.events` with `job.<jobId>`.
   - Publish `done`, then `ack` job.
   - On error: publish `error`, then `ack`.

## K8s / Rancher Deployment
- Use the same container image.
- Two Deployments:
  - API Deployment: runs Next.js (`node server.js`).
  - Worker Deployment: runs worker entrypoint (new script).
- Worker replicas: 1 (plus `x-single-active-consumer=true` for extra safety).
- RabbitMQ runs as a separate StatefulSet or managed service.

## Environment Variables
Required:
- `RABBITMQ_URL=amqp://user:pass@host:5672/oss-data-analyst`

Optional overrides (if desired):
- `RABBITMQ_JOBS_EXCHANGE=agent.jobs`
- `RABBITMQ_EVENTS_EXCHANGE=agent.events`
- `RABBITMQ_JOBS_QUEUE=agent.jobs`

## File Change List (planned)
1) `src/lib/rabbitmq.ts`
- New helper for connecting, asserting exchanges/queues, and creating channels.

2) `src/app/api/chat/route.ts`
- Replace direct `runAgent` call with:
  - enqueue job
  - create per-job events queue
  - stream events to client

3) `src/worker/agent-worker.ts`
- New worker entrypoint that consumes `agent.jobs`, runs `runAgent`, and publishes stream events.

4) `package.json`
- Add a worker script, e.g. `worker: "node dist/worker/agent-worker.js"` or `worker: "tsx src/worker/agent-worker.ts"` for dev.

5) `env.local.example`
- Add `RABBITMQ_URL` and optional RabbitMQ config values.

6) (Optional) `docs/rabbitmq.md`
- Add a short section describing the job/event topology and how to run the worker.

## Notes
- Events queues are deleted explicitly after `done`/`error` to avoid unbounded growth.
- With durable jobs and `ack` on completion, a worker restart safely re-queues the job.
