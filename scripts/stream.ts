import { generateText } from "ai";
import { openai } from "../src/lib/providers/openai";

const result = await generateText({
  model: openai("gpt-5"),
  prompt: "Generate a 10 word poem",
});

console.log(result.text);
