import type { CoachReview, CoachReviewInput } from "./coachReview.js";
import type { ImageSession, ImageSessionInput } from "./imageSession.js";
import type { MealReview, MealReviewInput } from "./mealReview.js";
import type {
  PhoneCameraSession,
  PhoneCameraSessionInput,
  PhoneCameraIceCandidateInput,
  PhoneCameraSignalState,
  PhoneCameraSessionDescription,
  PhoneCameraTunnelResponse
} from "./phoneCamera.js";
import type { PoseEvent, PoseEventInput } from "./poseEvent.js";
import type { Profile, ProfileInput } from "./profile.js";
import type { WorkoutSession, WorkoutSessionInput } from "./session.js";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface HealthResponse {
  ok: boolean;
  service: "shorir-api";
  adapter: string;
  timestamp: string;
}

export interface AnonymousSessionResponse {
  profileId: string;
  accessToken?: string;
}

export interface ApiContract {
  getHealth(): Promise<HealthResponse>;
  createAnonymousSession(): Promise<AnonymousSessionResponse>;
  saveProfile(input: ProfileInput & { id?: string }): Promise<Profile>;
  getProfile(profileId: string): Promise<Profile | null>;
  saveWorkoutSession(input: WorkoutSessionInput): Promise<WorkoutSession>;
  listSessions(profileId: string): Promise<WorkoutSession[]>;
  savePoseEvent(input: PoseEventInput): Promise<PoseEvent>;
  createCoachReview(input: CoachReviewInput): Promise<CoachReview>;
  listCoachReviews(profileId: string): Promise<CoachReview[]>;
  createImageSession(input: ImageSessionInput): Promise<ImageSession>;
  getImageSession(id: string): Promise<ImageSession>;
  getImageSessionReview(id: string): Promise<MealReview | null>;
  uploadMealImage(imageSessionId: string, file: File | Blob): Promise<MealReview>;
  createMealReview(input: MealReviewInput): Promise<MealReview>;
  createPhoneCameraSession(input: PhoneCameraSessionInput): Promise<PhoneCameraSession>;
  ensurePhoneCameraTunnel(): Promise<PhoneCameraTunnelResponse>;
  getPhoneCameraSignal(id: string): Promise<PhoneCameraSignalState>;
  savePhoneCameraOffer(id: string, input: PhoneCameraSessionDescription): Promise<PhoneCameraSignalState>;
  savePhoneCameraAnswer(id: string, input: PhoneCameraSessionDescription): Promise<PhoneCameraSignalState>;
  addPhoneCameraIceCandidate(id: string, input: PhoneCameraIceCandidateInput): Promise<PhoneCameraSignalState>;
}
