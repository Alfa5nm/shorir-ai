import type { AnalyzerSnapshot, FeedbackCode } from "./exerciseAnalyzer";

export interface DiagnosticIssue {
  reason: string;
  count: number;
  percent: number;
}

export interface SessionDiagnosticsSummary {
  totalFrames: number;
  readyFrames: number;
  blockedFrames: number;
  rejectedAttempts: number;
  countedReps: number;
  qualityScore: number;
  topIssues: DiagnosticIssue[];
  nextAction: string;
}

export interface SessionDiagnosticsTracker {
  reset(): void;
  record(snapshot: AnalyzerSnapshot): void;
  summary(): SessionDiagnosticsSummary;
}

const feedbackReasons: Partial<Record<FeedbackCode, string>> = {
  low_confidence: "Low landmark confidence",
  outside_region: "Left the activity area",
  too_close: "Too close to the camera",
  too_far: "Too far from the camera",
  hip_sag: "Hips sagged",
  hip_pike: "Hips were too high",
  wrist_alignment: "Shoulder and wrist misaligned",
  unstable_pose: "Pose moved too abruptly",
  not_side_on: "Body was not side-on",
  waiting_for_stable_top: "Top position was not stable",
  incomplete_depth: "Depth was not confirmed",
  shallow_rep: "Rep was too shallow"
};

function readableReason(reason: string) {
  const normalized = reason.replaceAll("_", " ").trim().toLowerCase();
  if (normalized.includes("confidence")) return "Low landmark confidence";
  if (normalized.includes("outside")) return "Left the activity area";
  if (normalized.includes("distance close")) return "Too close to the camera";
  if (normalized.includes("distance far")) return "Too far from the camera";
  if (normalized.includes("side") || normalized.includes("profile")) return "Body was not side-on";
  if (normalized.includes("abrupt") || normalized.includes("unstable")) return "Pose moved too abruptly";
  if (normalized.includes("stable pose")) return "Pose was not stable";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function frameReasons(snapshot: AnalyzerSnapshot) {
  if (snapshot.qualityReasons.length > 0) {
    return [...new Set(snapshot.qualityReasons.map(readableReason))];
  }
  const feedbackReason = feedbackReasons[snapshot.feedbackCode];
  return feedbackReason ? [feedbackReason] : [];
}

function actionFor(reason: string | undefined) {
  if (!reason) return "Keep the same setup and move through each rep with steady control.";
  if (reason.includes("confidence")) return "Improve lighting and keep every required joint visible.";
  if (reason.includes("activity area")) return "Move the camera back and stay centered inside the activity box.";
  if (reason.includes("close")) return "Move the camera farther away and recalibrate.";
  if (reason.includes("far")) return "Move closer to the camera and recalibrate.";
  if (reason.includes("side-on")) return "Turn fully side-on before recalibrating.";
  if (reason.includes("abrupt") || reason.includes("stable")) return "Slow down and hold the top position before each rep.";
  if (reason.includes("Depth") || reason.includes("shallow")) return "Use a controlled descent and briefly confirm the bottom position.";
  if (reason.includes("Hips")) return "Keep shoulders, hips, and ankles in one line throughout the push-up.";
  if (reason.includes("wrist")) return "Place the camera side-on and stack each shoulder over its wrist.";
  return "Recalibrate with a clear side view, then use slower, deliberate reps.";
}

export function createSessionDiagnosticsTracker(): SessionDiagnosticsTracker {
  let totalFrames = 0;
  let readyFrames = 0;
  let blockedFrames = 0;
  let rejectedAttempts = 0;
  let countedReps = 0;
  let attemptActive = false;
  let lastReps = 0;
  const issues = new Map<string, number>();

  return {
    reset() {
      totalFrames = 0;
      readyFrames = 0;
      blockedFrames = 0;
      rejectedAttempts = 0;
      countedReps = 0;
      attemptActive = false;
      lastReps = 0;
      issues.clear();
    },

    record(snapshot) {
      if (snapshot.calibrationPhase !== "complete" || snapshot.calibrationCompleted) return;

      totalFrames += 1;
      countedReps = snapshot.reps;

      if (snapshot.qualityStatus === "ready" && snapshot.repGateStatus !== "quality_blocked") {
        readyFrames += 1;
      } else {
        blockedFrames += 1;
        for (const reason of frameReasons(snapshot)) {
          issues.set(reason, (issues.get(reason) ?? 0) + 1);
        }
      }

      if (snapshot.phase === "descending" || snapshot.phase === "bottom" || snapshot.phase === "ascending") {
        attemptActive = true;
      }

      if (snapshot.reps > lastReps) {
        attemptActive = false;
      } else if (
        attemptActive &&
        (snapshot.repGateStatus === "quality_blocked" ||
          snapshot.feedbackCode === "shallow_rep" ||
          snapshot.feedbackCode === "incomplete_depth")
      ) {
        rejectedAttempts += 1;
        attemptActive = false;
        const reason = feedbackReasons[snapshot.feedbackCode];
        if (reason) issues.set(reason, (issues.get(reason) ?? 0) + 1);
      }

      lastReps = snapshot.reps;
    },

    summary() {
      const topIssues = [...issues.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([reason, count]) => ({
          reason,
          count,
          percent: blockedFrames > 0 ? Math.min(100, Math.round((count / blockedFrames) * 100)) : 0
        }));
      const readyRatio = totalFrames > 0 ? readyFrames / totalFrames : 0;
      const qualityScore = Math.max(0, Math.min(100, Math.round(readyRatio * 100 - rejectedAttempts * 4)));

      return {
        totalFrames,
        readyFrames,
        blockedFrames,
        rejectedAttempts,
        countedReps,
        qualityScore,
        topIssues,
        nextAction: actionFor(topIssues[0]?.reason)
      };
    }
  };
}
