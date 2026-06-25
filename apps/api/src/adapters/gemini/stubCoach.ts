import type { AICoach } from "../../ports/aiCoach.js";

export function createStubCoach(): AICoach {
  return {
    adapterName: "stub",
    async generateCoachReview({ profileId, session }) {
      return {
        profileId,
        sessionId: session.id,
        summaryBn: "আপনার সেশন সংরক্ষণ হয়েছে। পরের ধাপে ফর্ম স্থির রাখার দিকে মন দিন।",
        summaryEn: "Your session was saved. Next, focus on steady form and controlled tempo.",
        nextAction: "Repeat one short squat set after reviewing your stance.",
        formFocus: ["Controlled tempo", "Stable stance", "Confidence-aware feedback"],
        safetyNote: session.safetyFlag
          ? "Pain or safety concern was reported. Stop and consult a qualified professional if needed."
          : "No safety flag was reported in this scaffold session.",
        confidenceLevel: session.confidenceAvg > 0.75 ? "high" : "medium",
        encouragement: "Keep the next session short and consistent.",
        limitations: ["This is scaffold output until Gemini integration is enabled."]
      };
    },
    async generateMealReview({ profileId, imageSessionId, manualDescription }) {
      const base = imageSessionId === undefined ? {} : { imageSessionId };
      return {
        profileId,
        ...base,
        probableDishes: manualDescription ? [manualDescription] : ["Meal image received"],
        confidenceLevel: "low",
        portionQuestions: ["What was the approximate portion size?", "Was extra oil or ghee used?"],
        calorieRange: "400 - 600 kcal (Stub estimate)",
        macroNotes: ["Use manual confirmation before saving nutrition assumptions."],
        profileSignals: ["Local meal review interest"],
        limitations: ["This is scaffold output and not a precise calorie estimate."]
      };
    }
  };
}
