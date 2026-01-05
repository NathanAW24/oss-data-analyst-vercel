import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import z from "zod";

// Custom OpenAI provider configuration driven by environment variables.
const subscriptionKey = process.env.OPENAI_API_KEY;
const customOpenAI = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: "dummy", // still set apiKey field
  headers: subscriptionKey
    ? { "Ocp-Apim-Subscription-Key": subscriptionKey }
    : undefined,
});

export const extractSQLFromText = async (text: string): Promise<string> => {
  const { object } = await generateObject({
    model: customOpenAI("gpt-5.1-codex"),
    messages: [
      {
        role: "system",
        content: `You are an expert at extracting SQL queries from text. 
      Your task is to identify and extract the SQL query from the provided text. 
      You should return only the SQL query without any additional commentary or explanation.
      You should not return any markdown formatting, just the raw SQL.
      If no SQL query is found, return an empty string.`,
      },
      {
        role: "user",
        content: `Extract the SQL query from the following text:

\`\`\`
${text}
\`\`\`

Return only the SQL query.`,
      },
    ],
    schema: z.object({ sql: z.string() }),
  });

  return object.sql.trim();
};

export function hasSqlText(text: string): boolean {
  const sqlKeywords = [
    /SELECT\s+/i,
    /WITH\s+/i,
    /INSERT\s+/i,
    /UPDATE\s+/i,
    /DELETE\s+/i,
    /CREATE\s+/i,
  ];
  return sqlKeywords.some((pattern) => pattern.test(text));
}

export function toolResultsCount(steps: any[], toolName: string): number {
  return steps.reduce((acc, step) => {
    const matches =
      step.toolResults?.filter((result: any) => result.toolName === toolName)
        .length ?? 0;
    return acc + matches;
  }, 0);
}

const ResultObject = z.object({
  sql: z.string().min(1),
  csvBase64: z.string().min(1),
  preview: z.array(z.any()),
  vegaLite: z.any(),
  narrative: z.string().min(1),
  confidence: z.number().min(0).max(1),
});
export type ResultType = z.infer<typeof ResultObject>;
