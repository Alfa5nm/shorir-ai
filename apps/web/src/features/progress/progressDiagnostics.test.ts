import { describe, expect, it } from "vitest";
import type { PoseEvent } from "@shorir/contracts";
import { diagnosticsBySession } from "./progressDiagnostics";

describe("progress diagnostics", () => {
  it("indexes valid session-completed diagnostics", () => {
    const event: PoseEvent = {
      id: "event",
      profileId: "profile",
      sessionId: "session",
      eventType: "session_completed",
      metadata: {
        diagnostics: {
          totalFrames: 100,
          readyFrames: 80,
          blockedFrames: 20,
          rejectedAttempts: 1,
          countedReps: 5,
          qualityScore: 76,
          topIssues: [{ reason: "Low landmark confidence", count: 10, percent: 50 }],
          nextAction: "Improve lighting."
        }
      },
      createdAt: "2026-06-25T00:00:00.000Z"
    };
    expect(diagnosticsBySession([event]).get("session")?.qualityScore).toBe(76);
  });

  it("ignores unrelated or malformed metadata", () => {
    const event: PoseEvent = {
      id: "event",
      profileId: "profile",
      sessionId: "session",
      eventType: "session_completed",
      metadata: { diagnostics: { qualityScore: "bad" } },
      createdAt: "2026-06-25T00:00:00.000Z"
    };
    expect(diagnosticsBySession([event]).size).toBe(0);
  });
});
