import type {
  CoachReview,
  ImageSession,
  MealReview,
  PoseEvent,
  PoseEventInput,
  Profile,
  ProfileInput,
  WorkoutSession,
  WorkoutSessionInput
} from "@shorir/contracts";
import type { Database } from "../../ports/database.js";

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function now() {
  return new Date().toISOString();
}

export function createMemoryDatabase(): Database {
  const profiles = new Map<string, Profile>();
  const sessions = new Map<string, WorkoutSession>();
  const events = new Map<string, PoseEvent>();
  const coachReviews = new Map<string, CoachReview>();
  const imageSessions = new Map<string, ImageSession>();
  const mealReviews = new Map<string, MealReview>();

  return {
    adapterName: "memory",
    async createAnonymousProfile() {
      const profileId = id("profile");
      const timestamp = now();
      profiles.set(profileId, {
        id: profileId,
        language: "mixed",
        goal: "Start guided fitness safely",
        fitnessLevel: "beginner",
        equipment: ["none"],
        weeklySchedule: [],
        safety: { hasPain: false, painAreas: [] },
        createdAt: timestamp,
        updatedAt: timestamp
      });
      return { profileId };
    },
    async saveProfile(input: ProfileInput & { id?: string }) {
      const profileId = input.id ?? id("profile");
      const existing = profiles.get(profileId);
      const timestamp = now();
      const profile: Profile = {
        id: profileId,
        ...input,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp
      };
      console.log("[memoryDatabase] saveProfile input:", input);
      console.log("[memoryDatabase] saveProfile saved:", profile);
      profiles.set(profileId, profile);
      return profile;
    },
    async getProfile(profileId?: string) {
      if (profileId) {
        return profiles.get(profileId) ?? null;
      }
      return profiles.values().next().value ?? null;
    },
    async saveWorkoutSession(input: WorkoutSessionInput) {
      const session: WorkoutSession = { id: id("session"), ...input };
      sessions.set(session.id, session);
      return session;
    },
    async listSessions(profileId: string) {
      return [...sessions.values()].filter((session) => session.profileId === profileId);
    },
    async savePoseEvent(input: PoseEventInput) {
      const event: PoseEvent = { id: id("event"), ...input, createdAt: now() };
      events.set(event.id, event);
      return event;
    },
    async saveCoachReview(review: Omit<CoachReview, "id" | "createdAt">) {
      const saved: CoachReview = { id: id("coach_review"), ...review, createdAt: now() };
      coachReviews.set(saved.id, saved);
      return saved;
    },
    async listCoachReviews(profileId) {
      return [...coachReviews.values()]
        .filter((review) => review.profileId === profileId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async createImageSession(profileId: string) {
      const imageSessionId = id("image_session");
      const createdAt = now();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
      const imageSession: ImageSession = {
        id: imageSessionId,
        profileId,
        status: "pending",
        uploadUrl: `/capture/${imageSessionId}`,
        createdAt,
        expiresAt
      };
      imageSessions.set(imageSession.id, imageSession);
      return imageSession;
    },
    async getImageSession(imageSessionId: string) {
      return imageSessions.get(imageSessionId) ?? null;
    },
    async updateImageSessionStatus(imageSessionId, status) {
      const existing = imageSessions.get(imageSessionId);
      if (!existing) {
        throw new Error("Image session not found.");
      }
      const updated = { ...existing, status };
      imageSessions.set(imageSessionId, updated);
      return updated;
    },
    async saveMealReview(review: Omit<MealReview, "id" | "createdAt">) {
      const saved: MealReview = { id: id("meal_review"), ...review, createdAt: now() };
      mealReviews.set(saved.id, saved);
      return saved;
    },
    async getMealReviewByImageSession(imageSessionId) {
      return [...mealReviews.values()].find((review) => review.imageSessionId === imageSessionId) ?? null;
    }
  };
}
