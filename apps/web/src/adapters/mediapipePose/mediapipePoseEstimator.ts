import { FilesetResolver, PoseLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { PoseEstimator, PoseFrame, PoseLandmark } from "../../ports/poseEstimator";

const visionWasmBaseUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const poseModelUrl =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

const landmarkNames = [
  "nose",
  "left_eye_inner",
  "left_eye",
  "left_eye_outer",
  "right_eye_inner",
  "right_eye",
  "right_eye_outer",
  "left_ear",
  "right_ear",
  "mouth_left",
  "mouth_right",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_pinky",
  "right_pinky",
  "left_index",
  "right_index",
  "left_thumb",
  "right_thumb",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
  "left_heel",
  "right_heel",
  "left_foot_index",
  "right_foot_index"
] as const;

function toPoseLandmark(landmark: NormalizedLandmark, index: number): PoseLandmark {
  return {
    name: landmarkNames[index] ?? `landmark_${index}`,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    confidence: landmark.visibility ?? 0
  };
}

function toPoseFrame(landmarks: NormalizedLandmark[]): PoseFrame {
  const normalized = landmarks.map(toPoseLandmark);
  const confidence =
    normalized.length > 0
      ? normalized.reduce((total, landmark) => total + landmark.confidence, 0) / normalized.length
      : 0;

  return {
    landmarks: normalized,
    confidence,
    capturedAt: Date.now()
  };
}

export function createMediapipePoseEstimator(): PoseEstimator {
  const callbacks = new Set<(pose: PoseFrame) => void>();
  let landmarker: PoseLandmarker | null = null;
  let animationFrameId: number | null = null;
  let activeSource: HTMLVideoElement | HTMLCanvasElement | null = null;
  let lastVideoTime = -1;
  let lastCanvasDetectionAt = 0;
  let isRunning = false;

  async function ensureLandmarker() {
    if (landmarker) {
      return landmarker;
    }

    const vision = await FilesetResolver.forVisionTasks(visionWasmBaseUrl);
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: poseModelUrl,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.55,
      minPosePresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
      outputSegmentationMasks: false
    });

    return landmarker;
  }

  function emit(frame: PoseFrame) {
    for (const callback of callbacks) {
      callback(frame);
    }
  }

  function scheduleFrame() {
    animationFrameId = window.requestAnimationFrame(processFrame);
  }

  function processFrame() {
    if (!isRunning || !activeSource || !landmarker) {
      return;
    }

    const timestamp = performance.now();
    const source = activeSource;
    const canProcessVideo =
      source instanceof HTMLVideoElement &&
      source.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      source.currentTime !== lastVideoTime;
    const canProcessCanvas =
      source instanceof HTMLCanvasElement &&
      source.width > 0 &&
      source.height > 0 &&
      timestamp - lastCanvasDetectionAt >= 120;

    if (canProcessVideo || canProcessCanvas) {
      if (source instanceof HTMLVideoElement) {
        lastVideoTime = source.currentTime;
      } else {
        lastCanvasDetectionAt = timestamp;
      }
      const result = landmarker.detectForVideo(source, timestamp);
      const firstPose = result.landmarks[0];
      if (firstPose) {
        emit(toPoseFrame(firstPose));
      }
    }

    scheduleFrame();
  }

  return {
    async load() {
      await ensureLandmarker();
    },
    async start(sourceElement) {
      await ensureLandmarker();
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      activeSource = sourceElement;
      lastVideoTime = -1;
      lastCanvasDetectionAt = 0;
      isRunning = true;
      scheduleFrame();
    },
    async stop() {
      isRunning = false;
      activeSource = null;
      lastVideoTime = -1;
      lastCanvasDetectionAt = 0;
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },
    onPose(callback) {
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    }
  };
}
