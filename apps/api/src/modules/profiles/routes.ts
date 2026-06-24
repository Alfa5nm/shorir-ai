import { Router, type Router as ExpressRouter } from "express";
import type { ProfileInput } from "@shorir/contracts";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import type { ModuleDependencies } from "../dependencies.js";

export function createProfilesRouter({ database }: ModuleDependencies): ExpressRouter {
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const profile = await database.saveProfile(req.body as ProfileInput & { id?: string });
      res.json(profile);
    })
  );

  router.get(
    "/me",
    asyncHandler(async (req, res) => {
      const profileId = typeof req.query.profileId === "string" ? req.query.profileId : undefined;
      const profile = await database.getProfile(profileId);
      res.json(profile);
    })
  );

  return router;
}
