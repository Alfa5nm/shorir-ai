import { describe, expect, it } from "vitest";
import type { PoseFrame, PoseLandmark } from "../../ports/poseEstimator";
import { createExerciseAnalyzer } from "./exerciseAnalyzer";

function landmark(name: string, x: number, y: number, confidence = 0.99): PoseLandmark {
  return { name, x, y, confidence };
}

function frame(points: PoseLandmark[], confidence = 0.99): PoseFrame {
  return {
    landmarks: [
      ...points,
      landmark("nose", 0.2, 0.28),
      landmark("left_knee", 0.68, 0.42),
      landmark("left_heel", 0.82, 0.43),
      landmark("left_foot_index", 0.86, 0.44),
      landmark("right_shoulder", 0.3, 0.35, 0.1),
      landmark("right_elbow", 0.3, 0.55, 0.1),
      landmark("right_wrist", 0.3, 0.75, 0.1),
      landmark("right_hip", 0.55, 0.38, 0.1),
      landmark("right_knee", 0.68, 0.42, 0.1),
      landmark("right_ankle", 0.8, 0.41, 0.1)
    ],
    confidence,
    capturedAt: Date.now()
  };
}

function pushUpFrame(angle: "top" | "middle" | "bottom", hipOffset = 0, wristX = 0.3) {
  type Positions = {
    shoulder: [number, number];
    elbow: [number, number];
    wrist: [number, number];
    hip: [number, number];
    ankle: [number, number];
  };
  const positionTable: Record<"top" | "middle" | "bottom", Positions> = {
    top: {
      shoulder: [0.3, 0.35],
      elbow: [0.3, 0.55],
      wrist: [wristX, 0.75],
      hip: [0.55, 0.38 + hipOffset],
      ankle: [0.8, 0.41]
    },
    middle: {
      shoulder: [0.3, 0.47],
      elbow: [0.24, 0.59],
      wrist: [wristX, 0.75],
      hip: [0.55, 0.44 + hipOffset],
      ankle: [0.8, 0.41]
    },
    bottom: {
      shoulder: [0.3, 0.55],
      elbow: [0.2, 0.62],
      wrist: [wristX, 0.75],
      hip: [0.55, 0.48 + hipOffset],
      ankle: [0.8, 0.41]
    }
  };
  const positions = positionTable[angle];
  return frame([
    landmark("left_shoulder", ...positions.shoulder),
    landmark("left_elbow", ...positions.elbow),
    landmark("left_wrist", ...positions.wrist),
    landmark("left_hip", ...positions.hip),
    landmark("left_ankle", ...positions.ankle)
  ]);
}

function squatFrame(kneeX: number, kneeY: number) {
  return frame([
    landmark("left_shoulder", 0.46, 0.2),
    landmark("left_elbow", 0.5, 0.35),
    landmark("left_wrist", 0.52, 0.48),
    landmark("left_hip", 0.48, 0.43),
    landmark("left_knee", kneeX, kneeY),
    landmark("left_ankle", 0.5, 0.86)
  ]);
}

function calibratePushUp() {
  const analyzer = createExerciseAnalyzer("push-up");
  analyzer.beginCalibration();
  for (let index = 0; index < 24; index += 1) analyzer.process(pushUpFrame("top"));
  analyzer.process(pushUpFrame("middle"));
  analyzer.process(pushUpFrame("bottom"));
  const calibrated = analyzer.process(pushUpFrame("top"));
  expect(calibrated.calibrationPhase).toBe("complete");
  return analyzer;
}

function shifted(source: PoseFrame, deltaY: number): PoseFrame {
  return {
    ...source,
    landmarks: source.landmarks.map((point) => ({ ...point, y: point.y + deltaY }))
  };
}

describe("push-up analyzer", () => {
  it("calibrates and counts five ordered top-bottom-top repetitions once each", () => {
    const analyzer = calibratePushUp();
    for (let expectedReps = 1; expectedReps <= 5; expectedReps += 1) {
      analyzer.process(pushUpFrame("middle"));
      analyzer.process(pushUpFrame("bottom"));
      expect(analyzer.process(pushUpFrame("bottom")).reps).toBe(expectedReps - 1);
      analyzer.process(pushUpFrame("middle"));
      const completed = analyzer.process(pushUpFrame("top"));
      expect(completed.reps).toBe(expectedReps);
      expect(completed.feedbackCode).toBe("rep_completed");
      expect(analyzer.process(pushUpFrame("top")).reps).toBe(expectedReps);
    }
  });

  it("does not count shallow or incomplete movement", () => {
    const analyzer = calibratePushUp();
    analyzer.process(pushUpFrame("middle"));
    const shallow = analyzer.process(pushUpFrame("top"));
    expect(shallow.reps).toBe(0);
    expect(shallow.feedbackCode).toBe("shallow_rep");
    analyzer.process(pushUpFrame("bottom"));
    expect(analyzer.process(pushUpFrame("top")).reps).toBe(0);
  });

  it("pauses for low confidence and prioritizes alignment feedback", () => {
    const analyzer = calibratePushUp();
    const lowConfidence = analyzer.process({ ...pushUpFrame("top"), confidence: 0.2 });
    expect(lowConfidence.feedbackCode).toBe("low_confidence");
    const topFrame = pushUpFrame("top");
    const missingElbow = {
      ...topFrame,
      landmarks: topFrame.landmarks.filter((point) => point.name !== "left_elbow")
    };
    expect(analyzer.process(missingElbow).feedbackCode).toBe("low_confidence");
    expect(analyzer.process(pushUpFrame("top", 0.09)).feedbackCode).toBe("hip_sag");
    expect(analyzer.process(pushUpFrame("top", -0.09)).feedbackCode).toBe("hip_pike");
    expect(analyzer.process(pushUpFrame("top", 0, 0.42)).feedbackCode).toBe("wrist_alignment");
  });

  it("rejects movement outside the calibrated activity region", () => {
    const analyzer = calibratePushUp();
    const outside = analyzer.process(shifted(pushUpFrame("top"), 0.35));
    expect(outside.feedbackCode).toBe("outside_region");
    expect(outside.reps).toBe(0);
  });

  it("recalibration clears repetitions and personalized thresholds", () => {
    const analyzer = calibratePushUp();
    analyzer.process(pushUpFrame("middle"));
    analyzer.process(pushUpFrame("bottom"));
    analyzer.process(pushUpFrame("middle"));
    expect(analyzer.process(pushUpFrame("top")).reps).toBe(1);
    const reset = analyzer.beginCalibration();
    expect(reset.reps).toBe(0);
    expect(reset.calibrationProfile).toBeNull();
    expect(reset.calibrationPhase).toBe("standing");
  });
});

describe("squat analyzer", () => {
  it("preserves calibrated ordered squat counting", () => {
    const analyzer = createExerciseAnalyzer("squat");
    analyzer.beginCalibration();
    for (let index = 0; index < 36; index += 1) analyzer.process(squatFrame(0.49, 0.65));
    analyzer.process(squatFrame(0.66, 0.65));
    analyzer.process(squatFrame(0.49, 0.65));
    expect(analyzer.snapshot().calibrationPhase).toBe("complete");
    analyzer.process(squatFrame(0.57, 0.66));
    analyzer.process(squatFrame(0.66, 0.65));
    analyzer.process(squatFrame(0.57, 0.66));
    expect(analyzer.process(squatFrame(0.49, 0.65)).reps).toBe(1);
  });
});
