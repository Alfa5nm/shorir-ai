export interface ExerciseGuide {
  id: "squat" | "push-up" | "lunge";
  nameEn: string;
  nameBn: string;
  difficulty: "beginner" | "returning" | "intermediate";
  equipment: string[];
  setupSteps: string[];
  movementSteps: string[];
  commonMistakes: string[];
  safetyCues: string[];
  cameraGuidance: string[];
}

export const exerciseGuides: ExerciseGuide[] = [];
