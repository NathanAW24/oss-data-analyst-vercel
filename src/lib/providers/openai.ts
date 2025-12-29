import { createOpenAI } from "@ai-sdk/openai";

const subscriptionKey = process.env.OPENAI_API_KEY;

export const openai = createOpenAI({
  apiKey: "dummy",
  baseURL: process.env.OPENAI_BASE_URL,
  headers: subscriptionKey
    ? {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      }
    : undefined,
});
