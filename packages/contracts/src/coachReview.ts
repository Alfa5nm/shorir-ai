export type ConfidenceLevel = "low" | "medium" | "high";

export interface CoachReview {
  id: string;
  profileId: string;
  sessionId: string;
  summaryBn: string;
  summaryEn: string;
  nextAction: string;
  formFocus: string[];
  safetyNote: string;
  confidenceLevel: ConfidenceLevel;
  encouragement: string;
  limitations: string[];
  createdAt: string;
}

export interface CoachReviewInput {
  profileId: string;
  sessionId: string;
}
