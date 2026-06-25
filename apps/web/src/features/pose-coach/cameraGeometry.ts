export type CameraOrientation = "landscape" | "portrait" | "square";

export interface CameraGeometry {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: CameraOrientation;
}

export const defaultCameraGeometry: CameraGeometry = {
  width: 16,
  height: 9,
  aspectRatio: 16 / 9,
  orientation: "landscape"
};

export function resolveCameraGeometry(width: number, height: number): CameraGeometry {
  if (width <= 0 || height <= 0) return defaultCameraGeometry;
  const aspectRatio = width / height;
  const orientation: CameraOrientation =
    Math.abs(aspectRatio - 1) < 0.08 ? "square" : aspectRatio > 1 ? "landscape" : "portrait";
  return { width, height, aspectRatio, orientation };
}
