import { Router, type Router as ExpressRouter } from "express";
import type { PoseEventInput } from "@shorir/contracts";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import type { ModuleDependencies } from "../dependencies.js";

export function createEventsRouter({ database }: ModuleDependencies): ExpressRouter {
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const event = await database.savePoseEvent(req.body as PoseEventInput);
      res.json(event);
    })
  );

  return router;
}
