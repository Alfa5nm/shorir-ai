import type { ExerciseType } from "@shorir/contracts";
import type { PoseFrame, PoseLandmark } from "../../ports/poseEstimator";

export type SupportedExercise = Extract<ExerciseType, "squat" | "push-up">;
export type CalibrationPhase = "idle" | "standing" | "depth" | "complete";
export type DistanceStatus = "unknown" | "close" | "good" | "far";
export type ExercisePhase =
  | "idle"
  | "standing_ready"
  | "top_ready"
  | "descending"
  | "bottom"
  | "ascending";

export interface NormalizedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CalibrationProfile {
  region: NormalizedBox;
  topAngle: number;
  depthAngle: number;
  referenceScale: number;
  referenceDepth: number | null;
}

export type FeedbackCode =
  | "ready"
  | "low_confidence"
  | "calibration_setup"
  | "calibration_hold"
  | "calibration_move"
  | "calibration_return"
  | "calibration_complete"
  | "calibration_required"
  | "outside_region"
  | "too_close"
  | "too_far"
  | "hip_sag"
  | "hip_pike"
  | "wrist_alignment"
  | "descending"
  | "bottom"
  | "ascending"
  | "rep_completed"
  | "shallow_rep";

export interface AnalyzerSnapshot {
  exercise: SupportedExercise;
  confidence: number;
  primaryAngle: number | null;
  primaryAngleLabel: string;
  phase: ExercisePhase;
  reps: number;
  feedbackCode: FeedbackCode;
  feedback: string;
  calibrationPhase: CalibrationPhase;
  calibrationProfile: CalibrationProfile | null;
  livePoseBox: NormalizedBox | null;
  regionValid: boolean;
  distanceStatus: DistanceStatus;
  formValid: boolean;
  calibrationCompleted: boolean;
}

export interface ExerciseAnalyzer {
  readonly exercise: SupportedExercise;
  reset(): AnalyzerSnapshot;
  beginCalibration(): AnalyzerSnapshot;
  process(frame: PoseFrame): AnalyzerSnapshot;
  snapshot(): AnalyzerSnapshot;
}

export interface ExerciseDefinition {
  id: SupportedExercise;
  name: string;
  heading: string;
  primaryAngleLabel: string;
  initialFeedback: string;
  activeFeedback: string;
}

export const exerciseDefinitions: Record<SupportedExercise, ExerciseDefinition> = {
  squat: {
    id: "squat",
    name: "Squat",
    heading: "Live squat pose coach",
    primaryAngleLabel: "Knee angle",
    initialFeedback: "Stand side-on, keep your full body in frame, then start tracking.",
    activeFeedback: "Tracking is active. Stand tall once, then start a controlled squat."
  },
  "push-up": {
    id: "push-up",
    name: "Push-up",
    heading: "Live push-up pose coach",
    primaryAngleLabel: "Elbow angle",
    initialFeedback: "Set the camera side-on and keep shoulder, wrist, hip, and ankle visible.",
    activeFeedback: "Tracking is active. Hold a straight top plank to begin calibration."
  }
};

interface SideLandmarks {
  shoulder: PoseLandmark | null;
  elbow: PoseLandmark | null;
  wrist: PoseLandmark | null;
  hip: PoseLandmark | null;
  knee: PoseLandmark | null;
  ankle: PoseLandmark | null;
  confidence: number;
}

interface CalibrationSample {
  box: NormalizedBox;
  angle: number;
  bodyScale: number;
  depth: number | null;
}

function landmarkByName(frame: PoseFrame, name: string) {
  return frame.landmarks.find((landmark) => landmark.name === name) ?? null;
}

function averageConfidence(landmarks: Array<PoseLandmark | null>) {
  const available = landmarks.filter((landmark): landmark is PoseLandmark => Boolean(landmark));
  if (available.length === 0) return 0;
  return available.reduce((total, landmark) => total + landmark.confidence, 0) / available.length;
}

export function angleDegrees(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const denominator = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (denominator === 0) return null;
  const cosine = Math.min(1, Math.max(-1, (ab.x * cb.x + ab.y * cb.y) / denominator));
  return Math.round((Math.acos(cosine) * 180) / Math.PI);
}

function landmarkDistance(a: PoseLandmark, b: PoseLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function sideFor(frame: PoseFrame, side: "left" | "right"): SideLandmarks {
  const landmarks = {
    shoulder: landmarkByName(frame, `${side}_shoulder`),
    elbow: landmarkByName(frame, `${side}_elbow`),
    wrist: landmarkByName(frame, `${side}_wrist`),
    hip: landmarkByName(frame, `${side}_hip`),
    knee: landmarkByName(frame, `${side}_knee`),
    ankle: landmarkByName(frame, `${side}_ankle`)
  };
  return {
    ...landmarks,
    confidence: averageConfidence(Object.values(landmarks))
  };
}

function chooseSide(frame: PoseFrame, exercise: SupportedExercise) {
  const left = sideFor(frame, "left");
  const right = sideFor(frame, "right");
  return requiredConfidence(exercise, right) > requiredConfidence(exercise, left) ? right : left;
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function poseBox(frame: PoseFrame): NormalizedBox | null {
  const landmarks = frame.landmarks.filter((landmark) => landmark.confidence >= 0.55);
  if (landmarks.length < 8) return null;
  return poseBoxFromLandmarks(landmarks);
}

function poseBoxFromLandmarks(landmarks: PoseLandmark[]): NormalizedBox | null {
  if (landmarks.length < 3) return null;
  const xs = landmarks.map((landmark) => landmark.x);
  const ys = landmarks.map((landmark) => landmark.y);
  const x = clamp(Math.min(...xs));
  const y = clamp(Math.min(...ys));
  return {
    x,
    y,
    width: clamp(Math.max(...xs) - x),
    height: clamp(Math.max(...ys) - y)
  };
}

function requiredLandmarks(exercise: SupportedExercise, side: SideLandmarks): PoseLandmark[] {
  const required =
    exercise === "squat"
      ? [side.shoulder, side.hip, side.knee, side.ankle]
      : [side.shoulder, side.elbow, side.wrist, side.hip, side.ankle];
  return required.filter((landmark): landmark is PoseLandmark => landmark !== null && landmark.confidence >= 0.45);
}

function exercisePoseBox(frame: PoseFrame, exercise: SupportedExercise, side: SideLandmarks): NormalizedBox | null {
  const required = requiredLandmarks(exercise, side);
  const minimumRequired = exercise === "squat" ? 4 : 5;
  if (required.length < minimumRequired) return poseBox(frame);

  const requiredNames = new Set(required.map((landmark) => landmark.name));
  const optional = frame.landmarks.filter(
    (landmark) => landmark.confidence >= 0.55 && !requiredNames.has(landmark.name)
  );
  return poseBoxFromLandmarks([...required, ...optional]) ?? poseBoxFromLandmarks(required);
}

function bodyScale(exercise: SupportedExercise, side: SideLandmarks) {
  if (!side.shoulder || !side.hip || !side.ankle) return null;
  if (exercise === "squat") {
    if (!side.knee) return null;
    return (
      landmarkDistance(side.shoulder, side.hip) +
      landmarkDistance(side.hip, side.knee) +
      landmarkDistance(side.knee, side.ankle)
    );
  }
  return landmarkDistance(side.shoulder, side.hip) + landmarkDistance(side.hip, side.ankle);
}

function activityRegion(boxes: NormalizedBox[]): NormalizedBox {
  const left = Math.min(...boxes.map((box) => box.x));
  const top = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  const width = right - left;
  const height = bottom - top;
  const x = clamp(left - width * 0.24);
  const y = clamp(top - height * 0.08);
  return {
    x,
    y,
    width: Math.min(1 - x, width * 1.48),
    height: Math.min(1 - y, height * 1.14)
  };
}

function boxInsideRegion(box: NormalizedBox, region: NormalizedBox) {
  const tolerance = 0.025;
  return (
    box.x >= region.x - tolerance &&
    box.y >= region.y - tolerance &&
    box.x + box.width <= region.x + region.width + tolerance &&
    box.y + box.height <= region.y + region.height + tolerance
  );
}

function averageSample(samples: CalibrationSample[]) {
  const totals = samples.reduce(
    (result, sample) => ({
      angle: result.angle + sample.angle,
      bodyScale: result.bodyScale + sample.bodyScale,
      depth: result.depth + (sample.depth ?? 0),
      depthCount: result.depthCount + (sample.depth === null ? 0 : 1)
    }),
    { angle: 0, bodyScale: 0, depth: 0, depthCount: 0 }
  );
  const count = Math.max(samples.length, 1);
  return {
    angle: totals.angle / count,
    bodyScale: totals.bodyScale / count,
    depth: totals.depthCount > 0 ? totals.depth / totals.depthCount : null
  };
}

function requiredConfidence(exercise: SupportedExercise, side: SideLandmarks) {
  const required =
    exercise === "squat"
      ? [side.shoulder, side.hip, side.knee, side.ankle]
      : [side.shoulder, side.elbow, side.wrist, side.hip, side.ankle];
  return averageConfidence(required);
}

function primaryAngle(exercise: SupportedExercise, side: SideLandmarks) {
  if (exercise === "squat") {
    return side.hip && side.knee && side.ankle ? angleDegrees(side.hip, side.knee, side.ankle) : null;
  }
  return side.shoulder && side.elbow && side.wrist
    ? angleDegrees(side.shoulder, side.elbow, side.wrist)
    : null;
}

function averageDepth(side: SideLandmarks) {
  const landmarks = [side.shoulder, side.elbow, side.wrist, side.hip, side.knee, side.ankle].filter(
    (landmark): landmark is PoseLandmark => landmark !== null && typeof landmark.z === "number"
  );
  if (landmarks.length < 3) return null;
  return landmarks.reduce((total, landmark) => total + (landmark.z ?? 0), 0) / landmarks.length;
}

function depthStatusFrom(profile: CalibrationProfile, currentScale: number, currentDepth: number | null): DistanceStatus {
  const scaleRatio = currentScale / profile.referenceScale;
  if (scaleRatio > 1.42) return "close";
  if (scaleRatio < 0.66) return "far";

  if (profile.referenceDepth !== null && currentDepth !== null) {
    const depthDelta = currentDepth - profile.referenceDepth;
    if (depthDelta < -0.18 && scaleRatio > 1.14) return "close";
    if (depthDelta > 0.18 && scaleRatio < 0.88) return "far";
  }

  if (scaleRatio > 1.28) return "close";
  if (scaleRatio < 0.76) return "far";
  return "good";
}

function plankDeviation(side: SideLandmarks) {
  if (!side.shoulder || !side.hip || !side.ankle) return null;
  const totalX = side.ankle.x - side.shoulder.x;
  if (Math.abs(totalX) < 0.05) return null;
  const progress = (side.hip.x - side.shoulder.x) / totalX;
  const expectedY = side.shoulder.y + (side.ankle.y - side.shoulder.y) * progress;
  return side.hip.y - expectedY;
}

class StatefulExerciseAnalyzer implements ExerciseAnalyzer {
  readonly exercise: SupportedExercise;
  private phase: ExercisePhase = "idle";
  private reps = 0;
  private calibrationPhase: CalibrationPhase = "idle";
  private calibrationProfile: CalibrationProfile | null = null;
  private topSamples: CalibrationSample[] = [];
  private calibrationBoxes: NormalizedBox[] = [];
  private minimumDepthAngle: number | null = null;
  private current: AnalyzerSnapshot;

  constructor(exercise: SupportedExercise) {
    this.exercise = exercise;
    this.current = this.makeSnapshot({
      feedbackCode: "ready",
      feedback: exerciseDefinitions[exercise].initialFeedback
    });
  }

  private makeSnapshot(
    changes: Partial<AnalyzerSnapshot> & Pick<AnalyzerSnapshot, "feedbackCode" | "feedback">
  ): AnalyzerSnapshot {
    return {
      exercise: this.exercise,
      confidence: 0,
      primaryAngle: null,
      primaryAngleLabel: exerciseDefinitions[this.exercise].primaryAngleLabel,
      phase: this.phase,
      reps: this.reps,
      calibrationPhase: this.calibrationPhase,
      calibrationProfile: this.calibrationProfile,
      livePoseBox: null,
      regionValid: false,
      distanceStatus: "unknown",
      formValid: false,
      calibrationCompleted: false,
      ...changes
    };
  }

  snapshot() {
    return this.current;
  }

  reset() {
    this.phase = "idle";
    this.reps = 0;
    this.calibrationPhase = "idle";
    this.calibrationProfile = null;
    this.topSamples = [];
    this.calibrationBoxes = [];
    this.minimumDepthAngle = null;
    this.current = this.makeSnapshot({
      feedbackCode: "ready",
      feedback: exerciseDefinitions[this.exercise].initialFeedback
    });
    return this.current;
  }

  beginCalibration() {
    this.phase = "idle";
    this.reps = 0;
    this.calibrationPhase = "standing";
    this.calibrationProfile = null;
    this.topSamples = [];
    this.calibrationBoxes = [];
    this.minimumDepthAngle = null;
    this.current = this.makeSnapshot({
      feedbackCode: "calibration_setup",
      feedback:
        this.exercise === "squat"
          ? "Calibration: stand tall and still with your full body visible."
          : "Calibration: hold a straight top plank side-on with your full body visible."
    });
    return this.current;
  }

  process(frame: PoseFrame) {
    const side = chooseSide(frame, this.exercise);
    const box = exercisePoseBox(frame, this.exercise, side);
    const scale = bodyScale(this.exercise, side);
    const angle = primaryAngle(this.exercise, side);
    const depth = averageDepth(side);
    const confidence = Math.min(frame.confidence, requiredConfidence(this.exercise, side));
    const base = {
      confidence,
      primaryAngle: angle,
      livePoseBox: box,
      phase: this.phase,
      reps: this.reps,
      calibrationPhase: this.calibrationPhase,
      calibrationProfile: this.calibrationProfile
    };

    if (confidence < 0.55 || angle === null) {
      this.current = this.makeSnapshot({
        ...base,
        feedbackCode: "low_confidence",
        feedback:
          this.exercise === "squat"
            ? "Cannot assess confidently. Step back and keep shoulder, hip, knee, and ankle visible."
            : "Cannot assess confidently. Keep shoulder, elbow, wrist, hip, and ankle visible from the side."
      });
      return this.current;
    }

    if (this.calibrationPhase === "standing") {
      const validTop =
        this.exercise === "squat"
          ? Boolean(box && scale && box.height >= 0.34 && angle >= 145)
          : Boolean(box && scale && box.width >= 0.34 && angle >= 145 && Math.abs(plankDeviation(side) ?? 1) < 0.065);
      if (!validTop || !box || !scale) {
        this.current = this.makeSnapshot({
          ...base,
          feedbackCode: "calibration_setup",
          feedback:
            this.exercise === "squat"
              ? "Calibration: step back, stand tall, and keep your full body visible."
              : "Calibration: show your full side profile and hold a straight top plank."
        });
        return this.current;
      }

      this.topSamples.push({ box, angle, bodyScale: scale, depth });
      const sampleTarget = this.exercise === "squat" ? 14 : 10;
      if (this.topSamples.length < sampleTarget) {
        this.current = this.makeSnapshot({
          ...base,
          feedbackCode: "calibration_hold",
          feedback: `Calibration: hold still (${Math.round((this.topSamples.length / sampleTarget) * 100)}%).`
        });
        return this.current;
      }

      this.calibrationBoxes = this.topSamples.map((sample) => sample.box);
      this.calibrationPhase = "depth";
      this.current = this.makeSnapshot({
        ...base,
        calibrationPhase: "depth",
        feedbackCode: "calibration_move",
        feedback:
          this.exercise === "squat"
            ? "Calibration: perform one comfortable squat, then stand tall."
            : "Calibration: perform one comfortable push-up, then return to the top plank."
      });
      return this.current;
    }

    if (this.calibrationPhase === "depth") {
      if (!box) return this.current;
      this.calibrationBoxes.push(box);
      const top = averageSample(this.topSamples);
      this.minimumDepthAngle = Math.min(this.minimumDepthAngle ?? angle, angle);
      const minimumAngle = this.minimumDepthAngle;
      const requiredDrop = this.exercise === "squat" ? 28 : 30;
      const reachedDepth = minimumAngle <= top.angle - requiredDrop;
      const returnedToTop = angle >= top.angle - 10;

      if (reachedDepth && returnedToTop) {
        this.calibrationProfile = {
          region: activityRegion(this.calibrationBoxes),
          topAngle: Math.round(top.angle),
          depthAngle: Math.round(minimumAngle),
          referenceScale: top.bodyScale,
          referenceDepth: top.depth
        };
        this.calibrationPhase = "complete";
        this.phase = this.exercise === "squat" ? "standing_ready" : "top_ready";
        this.current = this.makeSnapshot({
          ...base,
          phase: this.phase,
          calibrationPhase: "complete",
          calibrationProfile: this.calibrationProfile,
          regionValid: true,
          distanceStatus: "good",
          formValid: true,
          calibrationCompleted: true,
          feedbackCode: "calibration_complete",
          feedback: "Calibration complete. Stay inside the activity box and begin when ready."
        });
      } else {
        this.current = this.makeSnapshot({
          ...base,
          feedbackCode: reachedDepth ? "calibration_return" : "calibration_move",
          feedback: reachedDepth
            ? this.exercise === "squat"
              ? "Calibration: return to a tall standing position."
              : "Calibration: press back to a straight top plank."
            : this.exercise === "squat"
              ? "Calibration: squat to a comfortable depth."
              : "Calibration: lower with control to a comfortable depth."
        });
      }
      return this.current;
    }

    const profile = this.calibrationProfile;
    if (!profile || !box || !scale) {
      this.current = this.makeSnapshot({
        ...base,
        feedbackCode: "calibration_required",
        feedback: "Calibrate the activity area before starting counted reps."
      });
      return this.current;
    }

    const regionValid = boxInsideRegion(box, profile.region);
    const distanceStatus = depthStatusFrom(profile, scale, depth);
    const assessed = { ...base, regionValid, distanceStatus };

    if (!regionValid) {
      this.current = this.makeSnapshot({
        ...assessed,
        feedbackCode: "outside_region",
        feedback: "Move your full body back inside the calibrated activity box."
      });
      return this.current;
    }
    if (distanceStatus !== "good") {
      this.current = this.makeSnapshot({
        ...assessed,
        feedbackCode: distanceStatus === "close" ? "too_close" : "too_far",
        feedback:
          distanceStatus === "close"
            ? "You are closer than calibration. Step slightly away from the camera."
            : "You are farther than calibration. Step slightly toward the camera."
      });
      return this.current;
    }

    if (this.exercise === "push-up") {
      const deviation = plankDeviation(side);
      if (deviation !== null && deviation > 0.06) {
        this.current = this.makeSnapshot({
          ...assessed,
          feedbackCode: "hip_sag",
          feedback: "Lift your hips slightly to keep shoulders, hips, and ankles in one line."
        });
        return this.current;
      }
      if (deviation !== null && deviation < -0.06) {
        this.current = this.makeSnapshot({
          ...assessed,
          feedbackCode: "hip_pike",
          feedback: "Lower your hips slightly to return to a straight plank."
        });
        return this.current;
      }
      if (side.shoulder && side.wrist && Math.abs(side.shoulder.x - side.wrist.x) / scale > 0.18) {
        this.current = this.makeSnapshot({
          ...assessed,
          feedbackCode: "wrist_alignment",
          feedback: "Stack your shoulder more directly over your wrist before continuing."
        });
        return this.current;
      }
    }

    let feedbackCode: FeedbackCode = "ready";
    let feedback = this.exercise === "squat" ? "Stand tall, then descend slowly." : "Hold the top plank, then lower slowly.";
    const topThreshold = profile.topAngle - 9;
    const descentThreshold = profile.topAngle - Math.max(18, (profile.topAngle - profile.depthAngle) * 0.3);
    const bottomThreshold = profile.depthAngle + 8;
    const ascentThreshold = profile.depthAngle + 18;

    if (this.phase === "idle" && angle > topThreshold) {
      this.phase = this.exercise === "squat" ? "standing_ready" : "top_ready";
      feedback = this.exercise === "squat" ? "Ready. Start a slow squat when stable." : "Ready. Lower with control when stable.";
    } else if ((this.phase === "standing_ready" || this.phase === "top_ready") && angle < descentThreshold) {
      this.phase = "descending";
      feedbackCode = "descending";
      feedback = "Descending. Keep your movement controlled.";
    } else if (this.phase === "descending" && angle < bottomThreshold) {
      this.phase = "bottom";
      feedbackCode = "bottom";
      feedback = this.exercise === "squat" ? "Good depth. Drive up smoothly." : "Good depth. Press up smoothly.";
    } else if (this.phase === "bottom" && angle > ascentThreshold) {
      this.phase = "ascending";
      feedbackCode = "ascending";
      feedback = this.exercise === "squat" ? "Ascending. Keep knees tracking steadily." : "Pressing up. Keep your body in one line.";
    } else if (this.phase === "ascending" && angle > topThreshold) {
      this.phase = this.exercise === "squat" ? "standing_ready" : "top_ready";
      this.reps += 1;
      feedbackCode = "rep_completed";
      feedback = this.exercise === "squat" ? "Rep counted. Reset tall before the next rep." : "Rep counted. Reset in a straight top plank.";
    } else if (this.phase === "descending" && angle > topThreshold) {
      this.phase = this.exercise === "squat" ? "standing_ready" : "top_ready";
      feedbackCode = "shallow_rep";
      feedback = "That rep was too shallow to count. Try a little more depth if comfortable.";
    }

    this.current = this.makeSnapshot({
      ...assessed,
      phase: this.phase,
      reps: this.reps,
      formValid: true,
      feedbackCode,
      feedback
    });
    return this.current;
  }
}

export function createExerciseAnalyzer(exercise: SupportedExercise): ExerciseAnalyzer {
  return new StatefulExerciseAnalyzer(exercise);
}
