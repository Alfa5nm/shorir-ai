export type ExerciseType = "squat" | "push-up" | "lunge";

export type CompletionStatus = "completed" | "partial" | "abandoned";

export interface WorkoutSession {
  id: string;
  profileId: string;
  exercise: ExerciseType;
  durationSeconds: number;
  repsCompleted: number;
  confidenceAvg: number;
  completionStatus: CompletionStatus;
  safetyFlag: boolean;
  startedAt: string;
  endedAt: string;
}

export interface WorkoutSessionInput {
  profileId: string;
  exercise: ExerciseType;
  durationSeconds: number;
  repsCompleted: number;
  confidenceAvg: number;
  completionStatus: CompletionStatus;
  safetyFlag: boolean;
  startedAt: string;
  endedAt: string;
}
