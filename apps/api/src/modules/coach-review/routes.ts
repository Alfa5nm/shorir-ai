import { Router, type Router as ExpressRouter } from "express";
import type { CoachReviewInput } from "@shorir/contracts";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import type { ModuleDependencies } from "../dependencies.js";

export function createCoachReviewRouter({ aiCoach, database }: ModuleDependencies): ExpressRouter {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const profileId = typeof req.query.profileId === "string" ? req.query.profileId : "";
      res.json(await database.listCoachReviews(profileId));
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const input = req.body as CoachReviewInput;
      const sessions = await database.listSessions(input.profileId);
      const session = sessions.find((candidate) => candidate.id === input.sessionId);
      if (!session) {
        res.status(404).json({ error: { code: "session_not_found", message: "Session not found." } });
        return;
      }
      const generated = await aiCoach.generateCoachReview({ profileId: input.profileId, session });
      const saved = await database.saveCoachReview(generated);
      res.json(saved);
    })
  );

  return router;
}
