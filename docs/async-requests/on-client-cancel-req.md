# On Client Cancel / Disconnect (RabbitMQ + Next.js)

## Summary
When the client closes the SSE connection, **the job is not canceled**.  
The API stops streaming, deletes the per-job events queue, and closes its AMQP channel.  
The job remains in RabbitMQ and the worker continues processing and acks it.

## Step-by-Step Behavior (Current Code)

1. **Client sends `/api/chat` request**
   - The API creates a job ID, declares a per-job events queue, and binds it.  
   - Code: `src/app/api/chat/route.ts:31-64`

2. **API enqueues the job**
   - Job is published to `agent.jobs` with `persistent: true`.  
   - Code: `src/app/api/chat/route.ts:66-72`

3. **API starts streaming results**
   - It consumes from the per-job events queue and streams SSE.  
   - Code: `src/app/api/chat/route.ts:93-129`

4. **Client closes the connection**
   - Next.js calls the stream `cancel()` handler.  
   - That triggers cleanup: cancel consumer, delete events queue, close channel.  
   - Code: `src/app/api/chat/route.ts:76-91` and `src/app/api/chat/route.ts:131-133`

5. **RabbitMQ does not cancel the job**
   - The job is stored in a durable queue (`agent.jobs`) and continues as normal.  
   - Code: `src/lib/rabbitmq.ts:83-106`

6. **Worker continues and acks the job**
   - The worker runs `runAgent`, publishes chunks and a final `done`/`error`, then acks.  
   - If the API already deleted the events queue, those events are dropped (no binding).  
   - Code: `src/worker/agent-worker.ts:82-104` and `src/worker/agent-worker.ts:128-146`

## Code Snippets (Key Points)

**API cleanup on cancel**
```ts
// src/app/api/chat/route.ts:76-91, 131-133
const cleanup = async () => {
  if (consumerTag) {
    await channel.cancel(consumerTag).catch(() => undefined);
  }
  if (eventsQueueNameRef) {
    await channel.deleteQueue(eventsQueueNameRef).catch(() => undefined);
  }
  await channel.close().catch(() => undefined);
};

const stream = new ReadableStream({
  cancel() {
    void cleanup();
  },
});
```

**Job is enqueued before streaming**
```ts
// src/app/api/chat/route.ts:66-72
channel.publish(
  config.jobsExchange,
  config.jobsRoutingKey,
  Buffer.from(jobPayload),
  { contentType: "application/json", persistent: true }
);
```

**Worker always acks**
```ts
// src/worker/agent-worker.ts:140-146
await publishStream(payload.jobId, response.body);
await publishDone(payload.jobId);
// ...
channel.ack(msg);
```

## Practical Implications
1. **Client disconnect does not stop the job.**  
   Jobs are durable and will be processed and acked.
2. **Events are dropped after cancel.**  
   The per-job events queue is deleted, so the worker’s updates won’t be seen.
3. **No cancellation signal exists today.**  
   There is no message from the API to the worker to stop a job mid-run.

## If You Need Cancellable Jobs (Optional Design Note)
You would need a separate cancellation signal (e.g., a `cancel` queue or a DB flag)
and the worker would need to check it during execution and exit early.
