import { Router, type Router as ExpressRouter } from "express";
import type { ImageSessionInput } from "@shorir/contracts";
import multer from "multer";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import type { ModuleDependencies } from "../dependencies.js";

export function createImageSessionsRouter({ aiCoach, database }: ModuleDependencies): ExpressRouter {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 6 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
    }
  });

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const input = req.body as ImageSessionInput;
      const imageSession = await database.createImageSession(input.profileId);
      res.json(imageSession);
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const imageSessionId = req.params.id;
      if (typeof imageSessionId !== "string") {
        res.status(400).json({ error: { code: "missing_image_session_id", message: "Image session id is required." } });
        return;
      }
      const imageSession = await database.getImageSession(imageSessionId);
      if (!imageSession) {
        res.status(404).json({ error: { code: "image_session_not_found", message: "Image session not found." } });
        return;
      }
      res.json(imageSession);
    })
  );

  router.get(
    "/:id/review",
    asyncHandler(async (req, res) => {
      const imageSessionId = String(req.params.id);
      const review = await database.getMealReviewByImageSession(imageSessionId);
      res.json(review);
    })
  );

  router.post(
    "/:id/upload",
    upload.single("image"),
    asyncHandler(async (req, res) => {
      const imageSessionId = req.params.id;
      if (typeof imageSessionId !== "string") {
        res.status(400).json({ error: { code: "missing_image_session_id", message: "Image session id is required." } });
        return;
      }
      const imageSession = await database.getImageSession(imageSessionId);
      if (!imageSession) {
        res.status(404).json({ error: { code: "image_session_not_found", message: "Image session not found." } });
        return;
      }
      if (!req.file) {
        res.status(400).json({
          error: { code: "missing_image", message: "A JPEG, PNG, or WebP image under 6 MB is required." }
        });
        return;
      }
      await database.updateImageSessionStatus(imageSession.id, "uploaded");
      const generated = await aiCoach.generateMealReview({
        profileId: imageSession.profileId,
        imageSessionId: imageSession.id,
        imageBase64: req.file.buffer.toString("base64"),
        imageMimeType: req.file.mimetype
      });
      const saved = await database.saveMealReview(generated);
      await database.updateImageSessionStatus(imageSession.id, "processed");
      res.json(saved);
    })
  );

  return router;
}
