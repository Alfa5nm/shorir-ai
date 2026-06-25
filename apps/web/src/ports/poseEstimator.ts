export interface PoseLandmark {
  name: string;
  x: number;
  y: number;
  z?: number;
  confidence: number;
}

export interface PoseFrame {
  landmarks: PoseLandmark[];
  confidence: number;
  capturedAt: number;
}

export interface PoseEstimator {
  load(): Promise<void>;
  start(sourceElement: HTMLVideoElement | HTMLCanvasElement): Promise<void>;
  stop(): Promise<void>;
  onPose(callback: (pose: PoseFrame) => void): () => void;
}
