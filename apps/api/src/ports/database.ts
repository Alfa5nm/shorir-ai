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

export interface Database {
  adapterName: string;
  createAnonymousProfile(): Promise<{ profileId: string }>;
  saveProfile(input: ProfileInput & { id?: string }): Promise<Profile>;
  getProfile(profileId?: string): Promise<Profile | null>;
  saveWorkoutSession(input: WorkoutSessionInput): Promise<WorkoutSession>;
  listSessions(profileId: string): Promise<WorkoutSession[]>;
  savePoseEvent(input: PoseEventInput): Promise<PoseEvent>;
  saveCoachReview(review: Omit<CoachReview, "id" | "createdAt">): Promise<CoachReview>;
  listCoachReviews(profileId: string): Promise<CoachReview[]>;
  createImageSession(profileId: string): Promise<ImageSession>;
  getImageSession(id: string): Promise<ImageSession | null>;
  updateImageSessionStatus(id: string, status: ImageSession["status"]): Promise<ImageSession>;
  saveMealReview(review: Omit<MealReview, "id" | "createdAt">): Promise<MealReview>;
  getMealReviewByImageSession(id: string): Promise<MealReview | null>;
}
