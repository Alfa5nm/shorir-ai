import type { CoachReview, MealReview, WorkoutSession } from "@shorir/contracts";

export interface CoachReviewContext {
  profileId: string;
  session: WorkoutSession;
}

export interface MealReviewContext {
  profileId: string;
  imageSessionId?: string;
  imageBase64?: string;
  imageMimeType?: string;
  manualDescription?: string;
}

export interface AICoach {
  adapterName: string;
  generateCoachReview(context: CoachReviewContext): Promise<Omit<CoachReview, "id" | "createdAt">>;
  generateMealReview(context: MealReviewContext): Promise<Omit<MealReview, "id" | "createdAt">>;
}
