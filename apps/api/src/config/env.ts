import "dotenv/config";

export interface ApiEnv {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  databaseAdapter: "memory" | "supabase";
  aiCoachAdapter: "stub" | "gemini";
  gemini: {
    authMode: "api_key" | "adc";
    apiKey?: string;
    model: string;
    useEnterprise: boolean;
    project?: string;
    location: string;
  };
}

export function loadEnv(): ApiEnv {
  const apiKey = process.env.GEMINI_API_KEY || undefined;
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || undefined;
  const authMode = process.env.GEMINI_AUTH_MODE === "adc" ? "adc" : "api_key";
  const useEnterprise =
    process.env.GEMINI_USE_ENTERPRISE === undefined
      ? authMode === "adc"
      : process.env.GEMINI_USE_ENTERPRISE === "true";

  return {
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    databaseAdapter: process.env.DATABASE_ADAPTER === "supabase" ? "supabase" : "memory",
    aiCoachAdapter: process.env.AI_COACH_ADAPTER === "gemini" ? "gemini" : "stub",
    gemini: {
      authMode,
      ...(apiKey ? { apiKey } : {}),
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      useEnterprise,
      ...(project ? { project } : {}),
      location: process.env.GOOGLE_CLOUD_LOCATION ?? "global"
    }
  };
}
