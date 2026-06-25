export interface MealReview {
  id: string;
  profileId: string;
  imageSessionId?: string;
  probableDishes: string[];
  confidenceLevel: "low" | "medium" | "high";
  portionQuestions: string[];
  calorieRange?: string;
  macroNotes: string[];
  profileSignals: string[];
  limitations: string[];
  createdAt: string;
}

export interface MealReviewInput {
  profileId: string;
  imageSessionId?: string;
  imageBase64?: string;
  manualDescription?: string;
}
