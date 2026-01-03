post /chat endpoint start inside `src/app/api/chat/route.ts`

```typescript
export async function POST(req: NextRequest) {
  try {
    ...
    const result = await runAgent({ messages: sanitized, model });
    ...
}
```

this `runAgent` function is the one we need, called from `src/lib/agent.ts`.


```typescript
export async function runAgent({
  messages,
  prompt,
  model = "openai/gpt-5.1-codex-max",
}: {
...
  const result = streamText({
     ...
  });
  ...
  return result;
}
```

How does this agent work? Mostly on the `streamText` API

streamText usage in `src/lib/agent.ts`

- `model`, `messages`, `providerOptions`: sends sanitized UI messages to the OpenAI model with reasoning enabled. &rarr; MODEL SELECTION & MSG PASSING
- `tools` + `activeTools` (set in `prepareStep`): exposes planning/building/execution/reporting tools, and per-step constrains which tools are callable. &rarr; TOOLS THAT CAN USE PER STEP
- `stopWhen`: stops on `FinalizeReport`/`FinalizeNoData`/`ClarifyIntent` tool results or after 100 steps. &rarr; STOP LLM ON CONDITIONS
- `onStepFinish`: logs each step and which tools were called. &rarr; FUNC ON STEP FIN
- `onFinish`: logs final reasoning and answer once streaming + tool executions complete. &rarr; FUNC ON `streamText` FIN
- `prepareStep`: swaps system prompts and active tools by phase (planning → building → execution → reporting) based on prior tool results. &rarr; BELOW BELOW BELOW (MOST IMPORTANT)


How `prepareStep` gets its `steps` (AI SDK internals)

- `streamText` runs a loop of steps. Each step = one model call plus any tool executions it triggers. After the step finishes, the SDK records a `StepResult` and appends it to an internal `steps` array, then increments `stepNumber`.
- Before starting the next step, the SDK calls your `prepareStep({ steps, stepNumber, model, messages })`. For the first call, `steps` is `[]` and `stepNumber` is `1`; afterwards, it contains all prior `StepResult`s.
- `StepResult` shape (`node_modules/.pnpm/ai@5.0.76_zod@4.1.12/node_modules/ai/dist/index.d.ts:596-687`): `{ content, text, reasoning, reasoningText, files, sources, toolCalls, staticToolCalls, dynamicToolCalls, toolResults, staticToolResults, dynamicToolResults, finishReason, usage, warnings, request, response: { messages, body? }, providerMetadata }`.
- That `steps` array is what you can inspect in `prepareStep` (or callbacks) to branch on past tool calls/results, usage, or finish reasons. The SDK constructs and passes it automatically each iteration.
