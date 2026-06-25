import { describe, expect, it } from "vitest";
import type { AnalyzerSnapshot } from "./exerciseAnalyzer";
import { createSessionDiagnosticsTracker } from "./sessionDiagnostics";

function snapshot(changes: Partial<AnalyzerSnapshot> = {}): AnalyzerSnapshot {
  return {
    exercise: "push-up",
    confidence: 0.9,
    primaryAngle: 160,
    primaryAngleLabel: "Elbow angle",
    phase: "top_ready",
    reps: 0,
    feedbackCode: "ready",
    feedback: "Ready",
    calibrationPhase: "complete",
    calibrationProfile: null,
    livePoseBox: null,
    regionValid: true,
    distanceStatus: "good",
    qualityStatus: "ready",
    qualityReasons: [],
    repGateStatus: "ready",
    formValid: true,
    calibrationCompleted: false,
    ...changes
  };
}

describe("session diagnostics", () => {
  it("ignores calibration frames and summarizes tracking quality", () => {
    const tracker = createSessionDiagnosticsTracker();
    tracker.record(snapshot({ calibrationPhase: "standing", qualityStatus: "blocked" }));
    tracker.record(snapshot());
    tracker.record(snapshot());
    tracker.record(snapshot({
      qualityStatus: "blocked",
      repGateStatus: "quality_blocked",
      feedbackCode: "outside_region",
      qualityReasons: ["outside calibrated box"]
    }));

    expect(tracker.summary()).toMatchObject({
      totalFrames: 3,
      readyFrames: 2,
      blockedFrames: 1,
      countedReps: 0
    });
    expect(tracker.summary().topIssues[0]?.reason).toBe("Left the activity area");
  });

  it("counts a failed in-progress movement as one rejected attempt", () => {
    const tracker = createSessionDiagnosticsTracker();
    tracker.record(snapshot({ phase: "descending", repGateStatus: "rep_in_progress" }));
    tracker.record(snapshot({
      phase: "top_ready",
      feedbackCode: "shallow_rep",
      repGateStatus: "waiting_for_stable_top"
    }));
    tracker.record(snapshot({
      phase: "top_ready",
      feedbackCode: "shallow_rep",
      repGateStatus: "waiting_for_stable_top"
    }));

    expect(tracker.summary().rejectedAttempts).toBe(1);
    expect(tracker.summary().topIssues[0]?.reason).toBe("Rep was too shallow");
  });

  it("does not reject an attempt that becomes a counted rep", () => {
    const tracker = createSessionDiagnosticsTracker();
    tracker.record(snapshot({ phase: "descending", repGateStatus: "rep_in_progress" }));
    tracker.record(snapshot({ phase: "bottom", repGateStatus: "rep_in_progress" }));
    tracker.record(snapshot({ phase: "top_ready", reps: 1, feedbackCode: "rep_completed", repGateStatus: "cooldown" }));

    const summary = tracker.summary();
    expect(summary.countedReps).toBe(1);
    expect(summary.rejectedAttempts).toBe(0);
    expect(summary.qualityScore).toBe(100);
  });

  it("recommends a concrete fix for the dominant issue", () => {
    const tracker = createSessionDiagnosticsTracker();
    tracker.record(snapshot({
      qualityStatus: "blocked",
      repGateStatus: "quality_blocked",
      feedbackCode: "low_confidence",
      qualityReasons: ["low landmark confidence"]
    }));

    expect(tracker.summary().nextAction).toContain("lighting");
  });
});
