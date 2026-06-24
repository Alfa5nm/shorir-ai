import { Router, type Router as ExpressRouter } from "express";
import type { MealReviewInput } from "@shorir/contracts";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import type { ModuleDependencies } from "../dependencies.js";

export function createMealReviewRouter({ aiCoach, database }: ModuleDependencies): ExpressRouter {
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const input = req.body as MealReviewInput;
      const generated = await aiCoach.generateMealReview(input);
      const saved = await database.saveMealReview(generated);
      res.json(saved);
    })
  );

  return router;
}
