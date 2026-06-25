import { describe, expect, it } from "vitest";
import type { Profile, WorkoutSession } from "@shorir/contracts";
import { createDailyWorkoutPlan } from "./dailyPlan";

const profile: Profile = {
  id: "profile",
  language: "mixed",
  goal: "Build a consistent exercise habit",
  fitnessLevel: "beginner",
  equipment: ["none"],
  weeklySchedule: ["Thursday"],
  safety: { hasPain: false, painAreas: [] },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

function session(exercise: WorkoutSession["exercise"], endedAt: string): WorkoutSession {
  return {
    id: `${exercise}-${endedAt}`,
    profileId: "profile",
    exercise,
    durationSeconds: 60,
    repsCompleted: 5,
    confidenceAvg: 0.8,
    completionStatus: "completed",
    safetyFlag: false,
    startedAt: endedAt,
    endedAt
  };
}

describe("daily workout plan", () => {
  it("respects the saved weekly schedule", () => {
    const plan = createDailyWorkoutPlan(profile, [], new Date("2026-06-26T12:00:00Z"));
    expect(plan.isTrainingDay).toBe(false);
    expect(plan.items).toEqual([]);
  });

  it("prioritizes exercises used less in recent sessions", () => {
    const sessions = [
      session("squat", "2026-06-25T10:00:00Z"),
      session("squat", "2026-06-24T10:00:00Z"),
      session("push-up", "2026-06-23T10:00:00Z")
    ];
    const plan = createDailyWorkoutPlan(profile, sessions, new Date("2026-06-25T12:00:00Z"));
    expect(plan.items[0]?.exercise).toBe("lunge");
    expect(plan.items).toHaveLength(2);
  });

  it("creates a conservative plan when pain is reported", () => {
    const plan = createDailyWorkoutPlan(
      { ...profile, safety: { hasPain: true, painAreas: ["knee"] } },
      [],
      new Date("2026-06-25T12:00:00Z")
    );
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]?.targetReps).toBe(4);
  });
});
