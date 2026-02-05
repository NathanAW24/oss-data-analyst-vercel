# On Client Cancel / Disconnect (RabbitMQ + Next.js)

## Summary
When the client closes the SSE connection, **the API publishes a cancel message**.  
The worker receives the cancel signal, aborts the in-flight job (if any), and acks it.  
The API also stops streaming, deletes the per-job events queue, and closes its AMQP channel.

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
   - The API publishes a cancel message and runs cleanup (cancel consumer, delete events queue, close channel).  
   - Code: `src/app/api/chat/route.ts:76-101` and `src/app/api/chat/route.ts:139-144`

5. **Worker receives the cancel signal**
   - The worker listens on a cancel queue and marks the job as canceled.  
   - If the job is currently running, it aborts `runAgent` with an `AbortSignal`.  
   - Code: `src/worker/agent-worker.ts:71-196`

6. **Worker acks the job**
   - The worker stops streaming, skips `done`, and acks the job.  
   - Any later events are dropped because the API deleted the events queue.  
   - Code: `src/worker/agent-worker.ts:150-186`

## Code Snippets (Key Points)

**API cancel publish + cleanup**
```ts
// src/app/api/chat/route.ts:76-101, 139-144
const publishCancel = async (reason: string) => {
  channel.publish(config.cancelExchange, config.cancelRoutingKey, ...);
};

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
    void publishCancel("client_disconnect");
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

**Worker aborts and acks**
```ts
// src/worker/agent-worker.ts:164-186
await publishStream(payload.jobId, response.body, abortController.signal);
if (abortController.signal.aborted) return;
await publishDone(payload.jobId);
// ...
channel.ack(msg);
```

## Practical Implications
1. **Client disconnect stops the job.**  
   The worker aborts the in-flight run and acks the message.
2. **Events are dropped after cancel.**  
   The per-job events queue is deleted, so the worker’s updates won’t be seen.
3. **Cancellation is in-memory only.**  
   If the worker restarts, a previously canceled job may run if it was requeued.
