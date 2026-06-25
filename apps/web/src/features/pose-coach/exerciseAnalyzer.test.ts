import { beforeEach, describe, expect, it } from "vitest";
import type { PoseFrame, PoseLandmark } from "../../ports/poseEstimator";
import { createExerciseAnalyzer } from "./exerciseAnalyzer";

function landmark(name: string, x: number, y: number, confidence = 0.99, z?: number): PoseLandmark {
  return z === undefined ? { name, x, y, confidence } : { name, x, y, confidence, z };
}

let capturedAt = 1_000;

beforeEach(() => {
  capturedAt = 1_000;
});

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
    capturedAt
  };
}

function next(source: PoseFrame, elapsedMs = 160): PoseFrame {
  capturedAt += elapsedMs;
  return { ...source, capturedAt };
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

function minimalPushUpFrame(angle: "top" | "middle" | "bottom") {
  const source = pushUpFrame(angle);
  return {
    ...source,
    landmarks: source.landmarks
      .filter((point) => point.name.startsWith("left_"))
      .map((point) => ({ ...point, z: angle === "bottom" ? -0.08 : -0.02 }))
  };
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

function lungeFrame(kneeX: number, kneeY: number) {
  const source = squatFrame(kneeX, kneeY);
  return {
    ...source,
    landmarks: source.landmarks.map((point) => {
      if (point.name === "right_shoulder") return { ...point, x: 0.43, y: 0.2, confidence: 0.99 };
      if (point.name === "right_hip") return { ...point, x: 0.44, y: 0.43, confidence: 0.99 };
      if (point.name === "right_knee") return { ...point, x: 0.38, y: 0.67, confidence: 0.99 };
      if (point.name === "right_ankle") return { ...point, x: 0.31, y: 0.86, confidence: 0.99 };
      return point;
    })
  };
}

function rightLungeFrame(kneeX: number, kneeY: number) {
  const source = lungeFrame(0.49, 0.65);
  return {
    ...source,
    landmarks: source.landmarks.map((point) => {
      if (point.name === "left_shoulder") return { ...point, x: 0.57, y: 0.2 };
      if (point.name === "left_hip") return { ...point, x: 0.56, y: 0.43 };
      if (point.name === "left_knee") return { ...point, x: 0.62, y: 0.67 };
      if (point.name === "left_ankle") return { ...point, x: 0.69, y: 0.86 };
      if (point.name === "right_shoulder") return { ...point, x: 0.54, y: 0.2, confidence: 0.99 };
      if (point.name === "right_hip") return { ...point, x: 0.52, y: 0.43, confidence: 0.99 };
      if (point.name === "right_knee") return { ...point, x: 1 - kneeX, y: kneeY, confidence: 0.99 };
      if (point.name === "right_ankle") return { ...point, x: 0.5, y: 0.86, confidence: 0.99 };
      return point;
    })
  };
}

function calibratePushUp() {
  const analyzer = createExerciseAnalyzer("push-up");
  analyzer.beginCalibration();
  for (let index = 0; index < 10; index += 1) analyzer.process(next(pushUpFrame("top")));
  analyzer.process(next(pushUpFrame("middle"), 180));
  analyzer.process(next(pushUpFrame("bottom"), 220));
  const calibrated = analyzer.process(next(pushUpFrame("top"), 260));
  expect(calibrated.calibrationPhase).toBe("complete");
  return analyzer;
}

function stabilizePushUpTop(analyzer: ReturnType<typeof createExerciseAnalyzer>) {
  let snapshot = analyzer.snapshot();
  for (let index = 0; index < 5; index += 1) {
    snapshot = analyzer.process(next(pushUpFrame("top"), 140));
  }
  return snapshot;
}

function completePushUpRep(analyzer: ReturnType<typeof createExerciseAnalyzer>) {
  const targetReps = analyzer.snapshot().reps + 1;
  stabilizePushUpTop(analyzer);
  for (let index = 0; index < 4; index += 1) analyzer.process(next(pushUpFrame("middle"), 180));
  for (let index = 0; index < 4; index += 1) analyzer.process(next(pushUpFrame("bottom"), 180));
  for (let index = 0; index < 4; index += 1) analyzer.process(next(pushUpFrame("middle"), 180));
  let snapshot = analyzer.snapshot();
  for (let index = 0; index < 10; index += 1) {
    snapshot = analyzer.process(next(pushUpFrame("top"), 180));
    if (snapshot.reps === targetReps) return snapshot;
  }
  return snapshot;
}

function calibrateSquat() {
  const analyzer = createExerciseAnalyzer("squat");
  analyzer.beginCalibration();
  for (let index = 0; index < 14; index += 1) analyzer.process(next(squatFrame(0.49, 0.65)));
  analyzer.process(next(squatFrame(0.57, 0.66), 180));
  analyzer.process(next(squatFrame(0.66, 0.65), 220));
  const calibrated = analyzer.process(next(squatFrame(0.49, 0.65), 260));
  expect(calibrated.calibrationPhase).toBe("complete");
  return analyzer;
}

function stabilizeSquatTop(analyzer: ReturnType<typeof createExerciseAnalyzer>) {
  let snapshot = analyzer.snapshot();
  for (let index = 0; index < 5; index += 1) {
    snapshot = analyzer.process(next(squatFrame(0.49, 0.65), 140));
  }
  return snapshot;
}

function completeSquatRep(analyzer: ReturnType<typeof createExerciseAnalyzer>) {
  const targetReps = analyzer.snapshot().reps + 1;
  stabilizeSquatTop(analyzer);
  for (let index = 0; index < 4; index += 1) analyzer.process(next(squatFrame(0.57, 0.66), 180));
  for (let index = 0; index < 4; index += 1) analyzer.process(next(squatFrame(0.66, 0.65), 180));
  for (let index = 0; index < 4; index += 1) analyzer.process(next(squatFrame(0.57, 0.66), 180));
  let snapshot = analyzer.snapshot();
  for (let index = 0; index < 10; index += 1) {
    snapshot = analyzer.process(next(squatFrame(0.49, 0.65), 180));
    if (snapshot.reps === targetReps) return snapshot;
  }
  return snapshot;
}

function calibrateLunge() {
  const analyzer = createExerciseAnalyzer("lunge");
  analyzer.beginCalibration();
  for (let index = 0; index < 14; index += 1) analyzer.process(next(lungeFrame(0.49, 0.65)));
  analyzer.process(next(lungeFrame(0.58, 0.66), 180));
  analyzer.process(next(lungeFrame(0.68, 0.65), 220));
  const calibrated = analyzer.process(next(lungeFrame(0.49, 0.65), 260));
  expect(calibrated.calibrationPhase).toBe("complete");
  return analyzer;
}

function completeLungeRep(analyzer: ReturnType<typeof createExerciseAnalyzer>) {
  const targetReps = analyzer.snapshot().reps + 1;
  for (let index = 0; index < 7; index += 1) analyzer.process(next(lungeFrame(0.49, 0.65), 140));
  for (let index = 0; index < 4; index += 1) analyzer.process(next(lungeFrame(0.58, 0.66), 180));
  for (let index = 0; index < 4; index += 1) analyzer.process(next(lungeFrame(0.68, 0.65), 180));
  for (let index = 0; index < 4; index += 1) analyzer.process(next(lungeFrame(0.58, 0.66), 180));
  let snapshot = analyzer.snapshot();
  for (let index = 0; index < 10; index += 1) {
    snapshot = analyzer.process(next(lungeFrame(0.49, 0.65), 180));
    if (snapshot.reps === targetReps) return snapshot;
  }
  return snapshot;
}

function shifted(source: PoseFrame, deltaY: number): PoseFrame {
  return {
    ...source,
    landmarks: source.landmarks.map((point) => ({ ...point, y: point.y + deltaY }))
  };
}

function scaled(source: PoseFrame, factor: number, centerX = 0.5, centerY = 0.5): PoseFrame {
  return {
    ...source,
    landmarks: source.landmarks.map((point) => ({
      ...point,
      x: centerX + (point.x - centerX) * factor,
      y: centerY + (point.y - centerY) * factor
    }))
  };
}

function finishPushUpWithoutReset(analyzer: ReturnType<typeof createExerciseAnalyzer>) {
  let snapshot = analyzer.snapshot();
  for (let index = 0; index < 4; index += 1) snapshot = analyzer.process(next(pushUpFrame("bottom"), 180));
  for (let index = 0; index < 4; index += 1) snapshot = analyzer.process(next(pushUpFrame("middle"), 180));
  for (let index = 0; index < 10; index += 1) snapshot = analyzer.process(next(pushUpFrame("top"), 180));
  return snapshot;
}

describe("push-up analyzer", () => {
  it("calibrates and counts five ordered top-bottom-top repetitions once each", () => {
    const analyzer = calibratePushUp();
    for (let expectedReps = 1; expectedReps <= 5; expectedReps += 1) {
      const completed = completePushUpRep(analyzer);
      expect(completed.reps).toBe(expectedReps);
      expect(completed.feedbackCode).toBe("rep_completed");
      expect(analyzer.process(next(pushUpFrame("top"), 120)).reps).toBe(expectedReps);
    }
  });

  it("calibrates from side-view landmarks without requiring a full-body landmark box", () => {
    const analyzer = createExerciseAnalyzer("push-up");
    analyzer.beginCalibration();
    for (let index = 0; index < 10; index += 1) analyzer.process(next(minimalPushUpFrame("top")));
    analyzer.process(next(minimalPushUpFrame("middle"), 180));
    analyzer.process(next(minimalPushUpFrame("bottom"), 220));
    const calibrated = analyzer.process(next(minimalPushUpFrame("top"), 260));
    expect(calibrated.calibrationPhase).toBe("complete");
    expect(calibrated.calibrationProfile?.referenceDepth).not.toBeNull();
    for (let index = 0; index < 5; index += 1) analyzer.process(next(minimalPushUpFrame("top"), 140));
    for (let index = 0; index < 4; index += 1) analyzer.process(next(minimalPushUpFrame("middle"), 180));
    for (let index = 0; index < 4; index += 1) analyzer.process(next(minimalPushUpFrame("bottom"), 180));
    for (let index = 0; index < 4; index += 1) analyzer.process(next(minimalPushUpFrame("middle"), 180));
    let completed = analyzer.snapshot();
    for (let index = 0; index < 10; index += 1) {
      completed = analyzer.process(next(minimalPushUpFrame("top"), 180));
      if (completed.reps === 1) break;
    }
    expect(completed.reps).toBe(1);
  });

  it("does not count shallow or incomplete movement", () => {
    const analyzer = calibratePushUp();
    stabilizePushUpTop(analyzer);
    for (let index = 0; index < 3; index += 1) analyzer.process(next(pushUpFrame("middle"), 180));
    const shallow = analyzer.process(next(pushUpFrame("top"), 180));
    expect(shallow.reps).toBe(0);
    expect(["ready", "shallow_rep", "waiting_for_stable_top", "unstable_pose"]).toContain(shallow.feedbackCode);
    analyzer.process(next(pushUpFrame("bottom"), 180));
    expect(analyzer.process(next(pushUpFrame("top"), 180)).reps).toBe(0);
  });

  it("does not count random movement without a stable top setup", () => {
    const analyzer = calibratePushUp();
    for (let index = 0; index < 3; index += 1) analyzer.process(next(pushUpFrame("middle"), 120));
    for (let index = 0; index < 3; index += 1) analyzer.process(next(pushUpFrame("bottom", 0.08), 120));
    for (let index = 0; index < 3; index += 1) analyzer.process(next(pushUpFrame("top", 0, 0.44), 120));

    const snapshot = analyzer.snapshot();
    expect(snapshot.reps).toBe(0);
    expect(snapshot.repGateStatus).not.toBe("cooldown");
  });

  it("pauses for low confidence and prioritizes alignment feedback", () => {
    const analyzer = calibratePushUp();
    stabilizePushUpTop(analyzer);
    const lowConfidence = analyzer.process(next({ ...pushUpFrame("top"), confidence: 0.2 }));
    expect(lowConfidence.feedbackCode).toBe("low_confidence");
    const topFrame = pushUpFrame("top");
    const missingElbow = {
      ...topFrame,
      landmarks: topFrame.landmarks.filter((point) => point.name !== "left_elbow")
    };
    expect(analyzer.process(next(missingElbow)).feedbackCode).toBe("low_confidence");
    stabilizePushUpTop(analyzer);
    expect(analyzer.process(next(pushUpFrame("top", 0.09), 160)).feedbackCode).toBe("hip_sag");
    stabilizePushUpTop(analyzer);
    expect(analyzer.process(next(pushUpFrame("top", -0.09), 160)).feedbackCode).toBe("hip_pike");
    stabilizePushUpTop(analyzer);
    expect(analyzer.process(next(pushUpFrame("top", 0, 0.42), 160)).feedbackCode).toBe("wrist_alignment");
  });

  it("does not advance a rep through low-confidence flicker", () => {
    const analyzer = calibratePushUp();
    stabilizePushUpTop(analyzer);
    for (let index = 0; index < 4; index += 1) analyzer.process(next(pushUpFrame("middle"), 180));

    const flicker = analyzer.process(next({ ...pushUpFrame("bottom"), confidence: 0.2 }, 180));
    expect(flicker.feedbackCode).toBe("low_confidence");
    expect(flicker.repGateStatus).toBe("quality_blocked");
    expect(finishPushUpWithoutReset(analyzer).reps).toBe(0);
  });

  it("rejects movement outside the calibrated activity region", () => {
    const analyzer = calibratePushUp();
    stabilizePushUpTop(analyzer);
    const outside = analyzer.process(next(shifted(pushUpFrame("top"), 0.35)));
    expect(outside.feedbackCode).toBe("outside_region");
    expect(outside.reps).toBe(0);
  });

  it("resets the current rep when the user leaves the activity region mid-rep", () => {
    const analyzer = calibratePushUp();
    stabilizePushUpTop(analyzer);
    for (let index = 0; index < 4; index += 1) analyzer.process(next(pushUpFrame("middle"), 180));

    const outside = analyzer.process(next(shifted(pushUpFrame("bottom"), 0.35), 180));
    expect(outside.feedbackCode).toBe("outside_region");
    expect(finishPushUpWithoutReset(analyzer).reps).toBe(0);
  });

  it("resets the current rep when camera distance changes mid-rep", () => {
    const analyzer = calibratePushUp();
    stabilizePushUpTop(analyzer);
    for (let index = 0; index < 4; index += 1) analyzer.process(next(pushUpFrame("middle"), 180));

    const closer = analyzer.process(next(scaled(pushUpFrame("bottom"), 1.5), 180));
    expect(["too_close", "outside_region", "unstable_pose"]).toContain(closer.feedbackCode);
    expect(finishPushUpWithoutReset(analyzer).reps).toBe(0);
  });

  it("does not double-count while holding top or bottom positions", () => {
    const analyzer = calibratePushUp();
    expect(completePushUpRep(analyzer).reps).toBe(1);
    for (let index = 0; index < 12; index += 1) analyzer.process(next(pushUpFrame("top"), 180));
    for (let index = 0; index < 12; index += 1) analyzer.process(next(pushUpFrame("bottom"), 180));
    for (let index = 0; index < 12; index += 1) analyzer.process(next(pushUpFrame("top"), 180));

    expect(analyzer.snapshot().reps).toBe(1);
  });

  it("recalibration clears repetitions and personalized thresholds", () => {
    const analyzer = calibratePushUp();
    expect(completePushUpRep(analyzer).reps).toBe(1);
    const reset = analyzer.beginCalibration();
    expect(reset.reps).toBe(0);
    expect(reset.calibrationProfile).toBeNull();
    expect(reset.calibrationPhase).toBe("standing");
  });
});

describe("squat analyzer", () => {
  it("preserves calibrated ordered squat counting", () => {
    const analyzer = calibrateSquat();
    expect(completeSquatRep(analyzer).reps).toBe(1);
  });

  it("does not count shallow or abrupt squat movement", () => {
    const analyzer = calibrateSquat();
    stabilizeSquatTop(analyzer);
    for (let index = 0; index < 3; index += 1) analyzer.process(next(squatFrame(0.57, 0.66), 180));
    expect(analyzer.process(next(squatFrame(0.49, 0.65), 180)).reps).toBe(0);

    stabilizeSquatTop(analyzer);
    for (let index = 0; index < 8; index += 1) analyzer.process(next(squatFrame(0.66, 0.65), 180));
    for (let index = 0; index < 8; index += 1) analyzer.process(next(squatFrame(0.49, 0.65), 180));
    expect(analyzer.snapshot().reps).toBe(0);
  });
});

describe("lunge analyzer", () => {
  it("calibrates and counts a controlled lunge once", () => {
    const analyzer = calibrateLunge();
    const completed = completeLungeRep(analyzer);
    expect({
      reps: completed.reps,
      phase: completed.phase,
      gate: completed.repGateStatus,
      feedback: completed.feedbackCode,
      side: completed.activeLungeSide
    }).toEqual({
      reps: 1,
      phase: "standing_ready",
      gate: "cooldown",
      feedback: "rep_completed",
      side: "left"
    });
    expect(completed.repCounts).toEqual({ left: 1, right: 0 });
  });

  it("rejects a shallow lunge", () => {
    const analyzer = calibrateLunge();
    for (let index = 0; index < 7; index += 1) analyzer.process(next(lungeFrame(0.49, 0.65), 140));
    for (let index = 0; index < 3; index += 1) analyzer.process(next(lungeFrame(0.57, 0.66), 180));
    expect(analyzer.process(next(lungeFrame(0.49, 0.65), 180)).reps).toBe(0);
  });

  it("pauses when either leg leaves tracking", () => {
    const analyzer = calibrateLunge();
    const missingRearAnkle = lungeFrame(0.49, 0.65);
    missingRearAnkle.landmarks = missingRearAnkle.landmarks.filter((point) => point.name !== "right_ankle");
    expect(analyzer.process(next(missingRearAnkle)).feedbackCode).toBe("low_confidence");
  });

  it("tracks left and right lunges independently after standing reset", () => {
    const analyzer = calibrateLunge();
    expect(completeLungeRep(analyzer).repCounts).toEqual({ left: 1, right: 0 });
    for (let index = 0; index < 6; index += 1) analyzer.process(next(rightLungeFrame(0.49, 0.65), 180));
    for (let index = 0; index < 4; index += 1) analyzer.process(next(rightLungeFrame(0.58, 0.66), 180));
    for (let index = 0; index < 4; index += 1) analyzer.process(next(rightLungeFrame(0.68, 0.65), 180));
    for (let index = 0; index < 4; index += 1) analyzer.process(next(rightLungeFrame(0.58, 0.66), 180));
    let completed = analyzer.snapshot();
    for (let index = 0; index < 10; index += 1) {
      completed = analyzer.process(next(rightLungeFrame(0.49, 0.65), 180));
      if (completed.reps === 2) break;
    }
    expect({
      reps: completed.reps,
      repCounts: completed.repCounts,
      phase: completed.phase,
      gate: completed.repGateStatus,
      feedback: completed.feedbackCode,
      side: completed.activeLungeSide
    }).toEqual({
      reps: 2,
      repCounts: { left: 1, right: 1 },
      phase: "standing_ready",
      gate: "cooldown",
      feedback: "rep_completed",
      side: "right"
    });
  });
});
