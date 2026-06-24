import { Router, type Router as ExpressRouter } from "express";
import { createAuthRouter } from "../modules/auth/routes.js";
import { createCoachReviewRouter } from "../modules/coach-review/routes.js";
import type { ModuleDependencies } from "../modules/dependencies.js";
import { createEventsRouter } from "../modules/events/routes.js";
import { createImageSessionsRouter } from "../modules/image-sessions/routes.js";
import { createMealReviewRouter } from "../modules/meal-review/routes.js";
import { createPhoneCameraSessionsRouter } from "../modules/phone-camera-sessions/routes.js";
import { createPhoneCameraTunnelRouter } from "../modules/phone-camera-sessions/tunnel.js";
import { createProfilesRouter } from "../modules/profiles/routes.js";
import { createSessionsRouter } from "../modules/sessions/routes.js";

export function createApiRouter(dependencies: ModuleDependencies, nodeEnv = "production"): ExpressRouter {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "shorir-api",
      adapter: dependencies.database.adapterName,
      timestamp: new Date().toISOString()
    });
  });

  router.use("/auth", createAuthRouter(dependencies));
  router.use("/profiles", createProfilesRouter(dependencies));
  router.use("/sessions", createSessionsRouter(dependencies));
  router.use("/events", createEventsRouter(dependencies));
  router.use("/coach-review", createCoachReviewRouter(dependencies));
  router.use("/image-sessions", createImageSessionsRouter(dependencies));
  router.use("/meal-review", createMealReviewRouter(dependencies));
  router.use("/phone-camera-sessions", createPhoneCameraSessionsRouter());
  router.use("/dev/phone-camera-tunnel", createPhoneCameraTunnelRouter(nodeEnv));

  return router;
}
