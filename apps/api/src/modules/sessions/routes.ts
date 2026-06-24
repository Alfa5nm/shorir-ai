import { Router, type Router as ExpressRouter } from "express";
import type { WorkoutSessionInput } from "@shorir/contracts";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import type { ModuleDependencies } from "../dependencies.js";

export function createSessionsRouter({ database }: ModuleDependencies): ExpressRouter {
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const session = await database.saveWorkoutSession(req.body as WorkoutSessionInput);
      res.json(session);
    })
  );

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const profileId = typeof req.query.profileId === "string" ? req.query.profileId : "";
      const sessions = await database.listSessions(profileId);
      res.json(sessions);
    })
  );

  return router;
}
