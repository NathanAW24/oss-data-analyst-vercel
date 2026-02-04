# On Worker Job Failure (RabbitMQ + Next.js)

## Summary
If the worker fails **during** job processing (LLM error, network failure, crash, etc.),
the API will only see an error if the worker explicitly publishes an `error` event.
If the worker crashes before sending that event, the API stream can hang until the client times out.

## Step-by-Step (Current Code)

1. **Worker is consuming `agent.jobs`**
   - The worker consumes jobs and processes them in `handleMessage`.  
   - Code: `src/worker/agent-worker.ts:106-152`

2. **Worker fails while executing**
   - Failures can occur inside `runAgent`, during streaming, or any runtime exception.  
   - Code: `src/worker/agent-worker.ts:128-144`

3. **If the worker catches the error**
   - The worker publishes an `error` message to the **events exchange** using the job ID routing key.  
   - Then it **acks** the original job message, so it is removed from the queue.  
   - Code: `src/worker/agent-worker.ts:65-72` and `src/worker/agent-worker.ts:143-146`

4. **API receives the `error` event**
   - The API stream handler sees `type === "error"`, calls `controller.error()`,
     and runs cleanup (cancel consumer, delete events queue, close channel).  
   - Code: `src/app/api/chat/route.ts:109-114` and `src/app/api/chat/route.ts:76-91`

5. **If the worker crashes before publishing error**
   - The job **may remain unacked** in RabbitMQ.
   - RabbitMQ will requeue unacked messages when the worker connection closes,
     so another worker can pick it up (standard RabbitMQ behavior).
   - The API **never receives** a `done` or `error` event, so the SSE stream stays open
     until the client or server times out.

## Code Snippets (Key Points)

**Worker error path and ack**
```ts
// src/worker/agent-worker.ts:65-72, 143-146
const publishError = async (jobId: string, error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const routingKey = getEventsRoutingKey(config, jobId);
  channel.publish(config.eventsExchange, routingKey, Buffer.from(errorMessage), {
    type: "error",
  });
};

// ...
} catch (error) {
  await publishError(payload.jobId, error);
} finally {
  channel.ack(msg);
}
```

**API handles worker error**
```ts
// src/app/api/chat/route.ts:109-114
if (messageType === "error") {
  const errorText = msg.content.toString("utf-8");
  controller.error(new Error(errorText));
  void cleanup();
  return;
}
```

## Practical Implications
1. **If the worker throws and catches**, the API returns an error to the client and closes cleanly.
2. **If the worker crashes hard**, the job is likely requeued, but the current API request
   will not receive an error and may hang until the client times out.
3. There is **no explicit retry policy** in the code. RabbitMQ requeue is the only retry
   that happens when a worker dies mid-job.

## Optional Improvements (Future)
1. Add a **timeout watchdog** in the API that sends an error if no events arrive after N minutes.
2. Add **job retries** with a DLX/TTL strategy instead of relying on requeue-after-crash.
3. Add a **cancellation signal** so the API can stop a job when the client disconnects.
