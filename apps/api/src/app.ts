import cors from "cors";
import express, { type Express } from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGeminiCoach } from "./adapters/gemini/geminiCoach.js";
import { createStubCoach } from "./adapters/gemini/stubCoach.js";
import { createBasicImageProcessor } from "./adapters/memory/basicImageProcessor.js";
import { createMemoryDatabase } from "./adapters/memory/memoryDatabase.js";
import { createNoopObjectStorage } from "./adapters/memory/noopObjectStorage.js";
import { createSupabaseDatabase } from "./adapters/supabase/supabaseDatabase.js";
import { loadEnv } from "./config/env.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { createApiRouter } from "./routes/index.js";

export function createApp(): Express {
  const env = loadEnv();
  const database = env.databaseAdapter === "supabase" ? createSupabaseDatabase() : createMemoryDatabase();
  const aiCoach = env.aiCoachAdapter === "gemini" ? createGeminiCoach(env.gemini) : createStubCoach();

  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: "2mb" }));

  app.use(
    "/api",
    createApiRouter({
      database,
      aiCoach,
      imageProcessor: createBasicImageProcessor(),
      objectStorage: createNoopObjectStorage()
    }, env.nodeEnv)
  );

  const webDistPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web/dist");
  if (env.nodeEnv === "production" && existsSync(webDistPath)) {
    app.use(express.static(webDistPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(webDistPath, "index.html"));
    });
  }

  app.use(errorMiddleware);

  return app;
}
