import { describe, expect, it } from "vitest";
import { localizedCoachCopy, localizedCoachFeedback } from "./coachingLanguage";

describe("localized coach feedback", () => {
  it("puts Bangla first for mixed coaching", () => {
    const feedback = localizedCoachFeedback("rep_completed", "Rep counted.", "mixed");
    expect(feedback.startsWith("রিপ গণনা")).toBe(true);
    expect(feedback.endsWith("Rep counted.")).toBe(true);
  });

  it("preserves English-only coaching", () => {
    expect(localizedCoachFeedback("ready", "Ready.", "en")).toBe("Ready.");
  });

  it("supports Bangla-only movement guidance", () => {
    expect(localizedCoachCopy("Move slowly.", "ধীরে নড়ুন।", "bn")).toBe("ধীরে নড়ুন।");
  });
});
