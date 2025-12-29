import type { UIMessage } from "ai";
import {
  stepCountIs,
  Experimental_Agent as _,
  generateText,
  convertToModelMessages,
  streamText,
} from "ai";
import {
  AssessEntityCoverage,
  ClarifyIntent,
  FinalizePlan,
  FinalizeNoData,
  LoadEntitiesBulk,
  ReadEntityYamlRaw,
  ScanEntityProperties,
  SearchCatalog,
  SearchSchema,
} from "./tools/planning";
import {
  BuildSQL,
  FinalizeBuild,
  JoinPathFinder,
  ValidateSQL,
} from "./tools/building";
import {
  EstimateCost,
  ExecuteSQL,
  ExecuteSQLWithRepair,
} from "./tools/execute-postgres";
import {
  ExplainResults,
  FinalizeReport,
  FormatResults,
  SanityCheck,
  VisualizeData,
} from "./tools/reporting";
import { PLANNING_SPECIALIST_SYSTEM_PROMPT } from "./prompts/planning";
import { BUILDING_SPECIALIST_SYSTEM_PROMPT } from "./prompts/building";
import { EXECUTION_MANAGER_SYSTEM_PROMPT } from "./prompts/execution";
import { REPORTING_SPECIALIST_SYSTEM_PROMPT } from "./prompts/reporting";
import { ListEntities } from "./semantic/io";
import { sqlEvalSet } from "./sample-queries";
import { openai } from "@/lib/providers/openai";
import type { LanguageModelV1 } from "ai";

const DEFAULT_OPENAI_MODEL = "gpt-5.1-codex-max";
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}
export type Phase = "planning" | "building" | "execution" | "reporting";

export async function runAgent({
  messages,
  prompt,
  model = "openai/gpt-5.1-codex-max",
}: {
  messages: UIMessage[];
  prompt?: string;
  model?: string;
}) {
  const resolvedModel: LanguageModelV1 | string = (() => {
    if (!model) return openai(DEFAULT_OPENAI_MODEL);
    if (model.startsWith("openai/")) {
      const [, modelName] = model.split("/");
      return openai(modelName || DEFAULT_OPENAI_MODEL);
    }
    return model;
  })();

  let phase: Phase = "planning";
  const possibleEntities = await ListEntities();

  const result = streamText({
    model: resolvedModel,
    messages: convertToModelMessages(messages),
    providerOptions: {
      openai: {
        reasoning: { effort: "medium" },
        reasoningSummary: "detailed",
      },
    },
    tools: {
      ReadEntityYamlRaw,
      LoadEntitiesBulk,
      ScanEntityProperties,
      AssessEntityCoverage,
      ClarifyIntent,
      SearchCatalog,
      SearchSchema,
      FinalizePlan,
      FinalizeNoData,
      BuildSQL,
      ValidateSQL,
      FinalizeBuild,
      EstimateCost,
      ExecuteSQL,
      ExecuteSQLWithRepair,
      SanityCheck,
      FormatResults,
      ExplainResults,
      FinalizeReport,
    },
    onFinish: ({ text, reasoningText, reasoning }) => {
      if (reasoningText || (reasoning && reasoning.length > 0)) {
        console.log("[Agent][Reasoning]", reasoningText ?? JSON.stringify(reasoning));
      }
      if (text) {
        console.log("[Agent][Answer]", text);
      }
    },
    stopWhen: [
      (ctx) =>
        ctx.steps.some((step) =>
          step.toolResults?.some(
            (t) =>
              t.toolName === "FinalizeReport" ||
              t.toolName === "FinalizeNoData" ||
              t.toolName === "ClarifyIntent"
          )
        ),
      stepCountIs(100),
    ],
    onStepFinish: ({ text, toolCalls }) => {
      console.log(
        `[Agent] Completed step ${text}: ${toolCalls
          .map((t) => t.toolName)
          .join(", ")}`
      );
    },
    prepareStep: async ({ steps, stepNumber }) => {
      console.log(
        `[Agent] Preparing step ${stepNumber}, current phase: ${phase}`
      );

      if (
        steps.some((step) =>
          step.toolResults?.some((t) => t.toolName === "FinalizePlan")
        )
      ) {
        phase = "building";
      }
      if (
        steps.some((step) =>
          step.toolResults?.some((t) => t.toolName === "FinalizeBuild")
        )
      ) {
        phase = "execution";
      }
      if (
        steps.some((step) =>
          step.toolResults?.some((t) => t.toolName === "ExecuteSQLWithRepair")
        )
      ) {
        phase = "reporting";
      }

      if (phase === "planning") {
        return {
          system: [
            PLANNING_SPECIALIST_SYSTEM_PROMPT,
            `<PossibleEntities>${JSON.stringify(
              possibleEntities
            )}</PossibleEntities>`,
            `<VerifiedQueries>${JSON.stringify(sqlEvalSet)}</VerifiedQueries>`,
          ].join("\n"),
          activeTools: [
            "ReadEntityYamlRaw",
            "LoadEntitiesBulk",
            "ScanEntityProperties",
            "AssessEntityCoverage",
            "ClarifyIntent",
            "SearchCatalog",
            "SearchSchema",
            "FinalizePlan",
            "FinalizeBuild",
            "FinalizeNoData",
          ],
        };
      }

      if (phase === "building") {
        return {
          system: `${BUILDING_SPECIALIST_SYSTEM_PROMPT}\n\nYou are generating SQL for a PostgreSQL database. Use standard PostgreSQL syntax. Ensure joins and identifiers align with the provided semantic entities.`,
          activeTools: [
            "JoinPathFinder",
            "BuildSQL",
            "ValidateSQL",
            "FinalizeBuild",
          ],
        };
      }

      if (phase === "execution") {
        return {
          system: `${EXECUTION_MANAGER_SYSTEM_PROMPT}\n\nYou are working with a PostgreSQL database. Use ExecuteSQLWithRepair to run the final query. EstimateCost is a simple heuristic placeholder.`,
          activeTools: ["EstimateCost", "ExecuteSQLWithRepair"],
        };
      }

      return {
        system: REPORTING_SPECIALIST_SYSTEM_PROMPT,
        activeTools: [
          "SanityCheck",
          "FormatResults",
          // "VisualizeData",
          "ExplainResults",
          "FinalizeReport",
        ],
      };
    },
  });

  return result;
}
