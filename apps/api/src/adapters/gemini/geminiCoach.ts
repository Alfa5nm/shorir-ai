import { GoogleGenAI, type GoogleGenAIOptions } from "@google/genai";
import { z } from "zod";
import type { AICoach, CoachReviewContext, MealReviewContext } from "../../ports/aiCoach.js";

export interface GeminiCoachOptions {
  authMode: "api_key" | "adc";
  apiKey?: string;
  model: string;
  useEnterprise: boolean;
  project?: string;
  location: string;
}

const confidenceSchema = z.enum(["low", "medium", "high"]);

const coachReviewSchema = z.object({
  summaryBn: z.string().min(1),
  summaryEn: z.string().min(1),
  nextAction: z.string().min(1),
  formFocus: z.array(z.string()).default([]),
  safetyNote: z.string().min(1),
  confidenceLevel: confidenceSchema,
  encouragement: z.string().min(1),
  limitations: z.array(z.string()).default([])
});

const mealReviewSchema = z.object({
  probableDishes: z.array(z.string()).default([]),
  confidenceLevel: confidenceSchema,
  portionQuestions: z.array(z.string()).default([]),
  calorieRange: z.string().optional(),
  macroNotes: z.array(z.string()).default([]),
  profileSignals: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([])
});

const coachReviewJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summaryBn: { type: "string" },
    summaryEn: { type: "string" },
    nextAction: { type: "string" },
    formFocus: { type: "array", items: { type: "string" } },
    safetyNote: { type: "string" },
    confidenceLevel: { type: "string", enum: ["low", "medium", "high"] },
    encouragement: { type: "string" },
    limitations: { type: "array", items: { type: "string" } }
  },
  required: [
    "summaryBn",
    "summaryEn",
    "nextAction",
    "formFocus",
    "safetyNote",
    "confidenceLevel",
    "encouragement",
    "limitations"
  ]
};

const mealReviewJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    probableDishes: { type: "array", items: { type: "string" } },
    confidenceLevel: { type: "string", enum: ["low", "medium", "high"] },
    portionQuestions: { type: "array", items: { type: "string" } },
    calorieRange: { type: "string" },
    macroNotes: { type: "array", items: { type: "string" } },
    profileSignals: { type: "array", items: { type: "string" } },
    limitations: { type: "array", items: { type: "string" } }
  },
  required: [
    "probableDishes",
    "confidenceLevel",
    "portionQuestions",
    "macroNotes",
    "profileSignals",
    "limitations"
  ]
};

function createClient(options: GeminiCoachOptions) {
  if (options.authMode === "api_key" && !options.apiKey) {
    throw new Error("GEMINI_API_KEY is required when GEMINI_AUTH_MODE=api_key.");
  }

  if (options.authMode === "adc" && !options.project) {
    throw new Error("GOOGLE_CLOUD_PROJECT or GCLOUD_PROJECT is required when GEMINI_AUTH_MODE=adc.");
  }

  let clientOptions: GoogleGenAIOptions;

  if (options.authMode === "adc") {
    const project = options.project;
    if (!project) {
      throw new Error("GOOGLE_CLOUD_PROJECT or GCLOUD_PROJECT is required when GEMINI_AUTH_MODE=adc.");
    }
    clientOptions = {
      enterprise: options.useEnterprise,
      vertexai: options.useEnterprise,
      project,
      location: options.location
    };
  } else {
    const apiKey = options.apiKey;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required when GEMINI_AUTH_MODE=api_key.");
    }
    clientOptions = { apiKey };
  }

  return new GoogleGenAI(clientOptions);
}

function parseJson<T>(text: string | undefined, schema: z.ZodSchema<T>): T {
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  const parsed = JSON.parse(cleaned) as unknown;
  return schema.parse(parsed);
}

function baseSafetyPrompt() {
  return [
    "You are SHORIR AI, a non-medical Bangla-first fitness and nutrition assistant.",
    "Return only valid JSON matching the requested schema.",
    "Do not diagnose, treat, or claim medical certainty.",
    "For meals, you MUST provide an estimated calorie range (e.g., '700 - 900 kcal') in the calorieRange field. Do NOT write paragraphs of text or disclaimers in this field.",
    "We aim for approximation and calibration, not perfection. Make your best educated guess based on visual volume and typical preparation methods in Bangladesh.",
    "To estimate portion sizes and depth, actively use environmental cues as a frame of reference (e.g., standard plate sizes, bowls, hands, cutlery, or recognizable branded items like a Coke bottle).",
    "Mention any remaining uncertainty (oil, hidden ingredients) briefly in the limitations array."
  ].join("\n");
}

export function createGeminiCoach(options: GeminiCoachOptions): AICoach {
  const ai = createClient(options);

  return {
    adapterName: options.authMode === "adc" ? "gemini-adc" : "gemini-api-key",
    async generateCoachReview(context: CoachReviewContext) {
      const response = await ai.models.generateContent({
          model: options.model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${baseSafetyPrompt()}

Create a concise coach review for this saved workout session.

Session:
${JSON.stringify(context.session, null, 2)}

Return the JSON object only.`
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: coachReviewJsonSchema
        }
      });

      const parsed = parseJson(response.text, coachReviewSchema);
      return {
        profileId: context.profileId,
        sessionId: context.session.id,
        summaryBn: parsed.summaryBn,
        summaryEn: parsed.summaryEn,
        nextAction: parsed.nextAction,
        formFocus: parsed.formFocus ?? [],
        safetyNote: parsed.safetyNote,
        confidenceLevel: parsed.confidenceLevel,
        encouragement: parsed.encouragement,
        limitations: parsed.limitations ?? []
      };
    },
    async generateMealReview(context: MealReviewContext) {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        {
          text: `${baseSafetyPrompt()}

Review this meal input for a Bangladesh-focused fitness user. If an image is provided, identify only probable dishes and ask portion questions. If only text is provided, use it cautiously.

Manual description:
${context.manualDescription ?? "None"}

Return the JSON object only.`
        }
      ];

      if (context.imageBase64) {
        parts.push({
          inlineData: {
            mimeType: context.imageMimeType ?? "image/jpeg",
            data: context.imageBase64
          }
        });
      }

      let response;
      try {
        response = await ai.models.generateContent({
          model: options.model,
          contents: [{ role: "user", parts }],
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: mealReviewJsonSchema
          }
        });
      } catch (err: any) {
        if (err.status === 503 || err.status === 429) {
          console.warn("[Gemini Fallback] Google API is overloaded or quota exceeded. Returning fallback data.");
          return {
            profileId: context.profileId,
            ...(context.imageSessionId ? { imageSessionId: context.imageSessionId } : {}),
            probableDishes: ["Unknown Dish (API Overloaded)"],
            confidenceLevel: "low",
            portionQuestions: [],
            calorieRange: "API Overloaded",
            macroNotes: ["Google Gemini API is currently experiencing high demand. Please try again later."],
            profileSignals: [],
            limitations: ["Google AI returned a 503 Service Unavailable or 429 error due to high demand."]
          };
        }
        throw err;
      }

      const parsed = parseJson(response.text, mealReviewSchema);
      const review = {
        profileId: context.profileId,
        probableDishes: parsed.probableDishes ?? [],
        confidenceLevel: parsed.confidenceLevel,
        portionQuestions: parsed.portionQuestions ?? [],
        macroNotes: parsed.macroNotes ?? [],
        profileSignals: parsed.profileSignals ?? [],
        limitations: parsed.limitations ?? []
      };

      return {
        ...review,
        ...(context.imageSessionId ? { imageSessionId: context.imageSessionId } : {}),
        ...(parsed.calorieRange ? { calorieRange: parsed.calorieRange } : {})
      };
    }
  };
}
