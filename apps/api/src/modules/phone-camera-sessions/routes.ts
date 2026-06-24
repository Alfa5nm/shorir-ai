import { Router, type Router as ExpressRouter } from "express";
import type {
  PhoneCameraIceCandidate,
  PhoneCameraIceCandidateInput,
  PhoneCameraSession,
  PhoneCameraSessionDescription,
  PhoneCameraSessionInput,
  PhoneCameraSignalState
} from "@shorir/contracts";
import { randomUUID } from "node:crypto";
import { asyncHandler } from "../../middleware/asyncHandler.js";

interface StoredPhoneCameraSession extends PhoneCameraSession {
  offer?: PhoneCameraSessionDescription;
  answer?: PhoneCameraSessionDescription;
  coachCandidates: PhoneCameraIceCandidate[];
  phoneCandidates: PhoneCameraIceCandidate[];
}

const sessions = new Map<string, StoredPhoneCameraSession>();
const sessionTtlMs = 30 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  return `phone_cam_${randomUUID()}`;
}

function isExpired(session: PhoneCameraSession) {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

function publicSession(session: StoredPhoneCameraSession): PhoneCameraSession {
  const expired = isExpired(session);
  return {
    id: session.id,
    profileId: session.profileId,
    status: expired ? "expired" : session.status,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt
  };
}

function signalState(session: StoredPhoneCameraSession): PhoneCameraSignalState {
  return {
    session: publicSession(session),
    ...(session.offer ? { offer: session.offer } : {}),
    ...(session.answer ? { answer: session.answer } : {}),
    coachCandidates: session.coachCandidates,
    phoneCandidates: session.phoneCandidates
  };
}

function getSessionOr404(id: string) {
  const session = sessions.get(id);
  if (!session) {
    return null;
  }
  if (isExpired(session)) {
    session.status = "expired";
  }
  return session;
}

export function createPhoneCameraSessionsRouter(): ExpressRouter {
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const input = req.body as PhoneCameraSessionInput;
      if (!input.profileId) {
        res.status(400).json({ error: { code: "missing_profile_id", message: "Profile id is required." } });
        return;
      }

      const createdAt = nowIso();
      const session: StoredPhoneCameraSession = {
        id: createId(),
        profileId: input.profileId,
        status: "pending",
        createdAt,
        expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
        coachCandidates: [],
        phoneCandidates: []
      };
      sessions.set(session.id, session);
      res.json(publicSession(session));
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const sessionId = req.params.id;
      if (typeof sessionId !== "string") {
        res.status(400).json({ error: { code: "missing_session_id", message: "Phone camera session id is required." } });
        return;
      }
      const session = getSessionOr404(sessionId);
      if (!session) {
        res.status(404).json({ error: { code: "session_not_found", message: "Phone camera session not found." } });
        return;
      }
      res.json(publicSession(session));
    })
  );

  router.get(
    "/:id/signal",
    asyncHandler(async (req, res) => {
      const session = getSessionOr404(String(req.params.id));
      if (!session) {
        res.status(404).json({ error: { code: "session_not_found", message: "Phone camera session not found." } });
        return;
      }
      res.json(signalState(session));
    })
  );

  router.post(
    "/:id/offer",
    asyncHandler(async (req, res) => {
      const session = getSessionOr404(String(req.params.id));
      const input = req.body as PhoneCameraSessionDescription;
      if (!session || input.type !== "offer" || !input.sdp) {
        res.status(session ? 400 : 404).json({
          error: {
            code: session ? "invalid_offer" : "session_not_found",
            message: session ? "A valid WebRTC offer is required." : "Phone camera session not found."
          }
        });
        return;
      }
      session.offer = input;
      delete session.answer;
      session.coachCandidates = [];
      session.phoneCandidates = [];
      session.status = "pending";
      res.json(signalState(session));
    })
  );

  router.post(
    "/:id/answer",
    asyncHandler(async (req, res) => {
      const session = getSessionOr404(String(req.params.id));
      const input = req.body as PhoneCameraSessionDescription;
      if (!session || input.type !== "answer" || !input.sdp) {
        res.status(session ? 400 : 404).json({
          error: {
            code: session ? "invalid_answer" : "session_not_found",
            message: session ? "A valid WebRTC answer is required." : "Phone camera session not found."
          }
        });
        return;
      }
      session.answer = input;
      session.status = "connected";
      res.json(signalState(session));
    })
  );

  router.post(
    "/:id/ice-candidates",
    asyncHandler(async (req, res) => {
      const session = getSessionOr404(String(req.params.id));
      const input = req.body as PhoneCameraIceCandidateInput;
      if (!session || !["coach", "phone"].includes(input.role) || !input.candidate?.candidate) {
        res.status(session ? 400 : 404).json({
          error: {
            code: session ? "invalid_ice_candidate" : "session_not_found",
            message: session ? "A valid ICE candidate and peer role are required." : "Phone camera session not found."
          }
        });
        return;
      }
      const candidates = input.role === "coach" ? session.coachCandidates : session.phoneCandidates;
      if (!candidates.some((candidate) => candidate.candidate === input.candidate.candidate)) {
        candidates.push(input.candidate);
      }
      res.json(signalState(session));
    })
  );

  return router;
}
