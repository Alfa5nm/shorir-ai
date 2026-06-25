import { describe, expect, it } from "vitest";
import {
  exerciseGuideById,
  exerciseGuides,
  liveCoachGuideFromSearch,
  liveCoachPath
} from "./exerciseGuides";

describe("exercise guide live coaching", () => {
  it("builds a coach route that preserves the originating guide", () => {
    const guide = exerciseGuideById("push-up");
    expect(guide).not.toBeNull();
    expect(liveCoachPath(guide!)).toBe("/coach?exercise=push-up&from=library&guide=push-up");
  });

  it("routes the standard dataset push-up to the supported analyzer", () => {
    const guide = exerciseGuideById("0662");
    expect(guide?.liveCoachExercise).toBe("push-up");
    expect(liveCoachPath(guide!)).toContain("exercise=push-up");
  });

  it("does not offer bodyweight coaching for weighted squat variants", () => {
    const weightedSquats = exerciseGuides.filter((guide) =>
      guide.nameEn.includes("squat") && guide.id !== "squat"
    );
    expect(weightedSquats.length).toBeGreaterThan(0);
    expect(weightedSquats.every((guide) => liveCoachPath(guide) === null)).toBe(true);
  });

  it("accepts only matching library context on the coach route", () => {
    const valid = new URLSearchParams("exercise=push-up&from=library&guide=0662");
    const mismatched = new URLSearchParams("exercise=squat&from=library&guide=0662");
    const direct = new URLSearchParams("exercise=push-up&guide=0662");

    expect(liveCoachGuideFromSearch(valid)?.id).toBe("0662");
    expect(liveCoachGuideFromSearch(mismatched)).toBeNull();
    expect(liveCoachGuideFromSearch(direct)).toBeNull();
  });

  it("routes the curated lunge guide to the lunge analyzer", () => {
    const guide = exerciseGuideById("lunge");
    expect(guide?.liveCoachExercise).toBe("lunge");
    expect(liveCoachPath(guide!)).toContain("exercise=lunge");
  });
});
