# Stress Test Timeouts (undici Headers Timeout)

## Logs Example

```bash
nwiryawa@XAPTRAVEL30:~/work/oss-data-analyst-vercel$ nwiryawa@XAPTRAVEL30:~/work/oss-data-analyst-vercel$ pnpm tsx tests/stress/chat_endpoint.ts
 WARN  Unsupported engine: wanted: {"node":">=20.0.0 <21.0.0"} (current: {"node":"v24.12.0","pnpm":"8.15.0"})
Stress testing http://localhost:3000/api/chat
Concurrent requests: 5
Results directory: tests/stress/chat_endpoint_results/2026-02-04T06-39-20-721Z
Request #1: failed (n/a) 300823ms TypeError: fetch failed | cause=HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT): Headers Timeout Error
Request #2: failed (n/a) 300808ms TypeError: fetch failed | cause=HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT): Headers Timeout Error
Request #3: failed (n/a) 300806ms TypeError: fetch failed | cause=HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT): Headers Timeout Error
Request #4: failed (n/a) 300806ms TypeError: fetch failed | cause=HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT): Headers Timeout Error
Request #5: failed (n/a) 300806ms TypeError: fetch failed | cause=HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT): Headers Timeout Error

Stress test summary:
Total requests: 5
Succeeded: 0
Failed: 5
Average duration: 300809.80 ms
Average bytes: 0.00 bytes

Failures:
#1: status=n/a error=TypeError: fetch failed | cause=HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT): Headers Timeout Error
#2: status=n/a error=TypeError: fetch failed | cause=HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT): Headers Timeout Error
#3: status=n/a error=TypeError: fetch failed | cause=HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT): Headers Timeout Error
#4: status=n/a error=TypeError: fetch failed | cause=HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT): Headers Timeout Error
#5: status=n/a error=TypeError: fetch failed | cause=HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT): Headers Timeout Error
```

The Next.js and the worker no error. The Next.js closed connection early, but still considered no error from the Next.js itself, the worker also keeps running even after the Next.js closed, so its at the moment running ok. The issue is in the undici library used by the fetch within the test script (so this is a client issue)
, like the browser suddenly close connection to the Next.js kinda issue. If u look google for `UND_ERR_HEADERS_TIMEOUT` or ask codex can know that is a client issue.

## Explanation

**Summary**
The stress test failures are caused by the **client-side Node.js fetch timeout** (undici), not by Next.js or the worker. The API and worker can run longer than 300 seconds, but undici’s default headers timeout is 300 seconds. The client times out first, so it aborts the request even though the server is still processing.

**Symptoms**
1. Stress test output shows errors like:
   - `HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT)`
   - `fetch failed`
2. Next.js logs show the request handled and eventually returning `200` after ~300 seconds.
3. Worker logs show no runtime crash; jobs continue to run.

**Root Cause**
Node’s `fetch` is powered by **undici**. By default, undici enforces a **headers timeout** of about **300 seconds**. If the server has not sent response headers by then, the client aborts the request and reports a timeout error.  
In our flow, headers are only sent once the worker starts publishing events, so long-running jobs can exceed this window.

**What This Is Not**
1. Not a Next.js server error. The API route is running and returning responses.
2. Not a worker runtime crash. The worker continues executing jobs.
3. Not RabbitMQ dropping the connection. The client never waits long enough to see events.

**Fix**
Increase the client timeouts used by the stress test script. The script supports these environment variables:
```bash
CHAT_HEADERS_TIMEOUT_MS=600000   # 10 minutes
CHAT_BODY_TIMEOUT_MS=0           # 0 disables body timeout
```

**Example**
```bash
CHAT_HEADERS_TIMEOUT_MS=900000 CHAT_BODY_TIMEOUT_MS=0 pnpm tsx tests/stress/chat_endpoint.ts 5
```

**Notes**
If you need the client to wait indefinitely, keep `CHAT_BODY_TIMEOUT_MS=0` and set `CHAT_HEADERS_TIMEOUT_MS` to a suitably large value. The API and worker can safely exceed 300 seconds when processing large or complex requests.
