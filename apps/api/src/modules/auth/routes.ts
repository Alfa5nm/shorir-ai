import { Router, type Router as ExpressRouter } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import type { ModuleDependencies } from "../dependencies.js";

export function createAuthRouter({ database }: ModuleDependencies): ExpressRouter {
  const router = Router();

  router.post(
    "/anonymous",
    asyncHandler(async (_req, res) => {
      const session = await database.createAnonymousProfile();
      res.json(session);
    })
  );

  return router;
}
