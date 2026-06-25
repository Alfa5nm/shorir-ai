import { describe, expect, it } from "vitest";
import { resolveCameraGeometry } from "./cameraGeometry";

describe("camera geometry", () => {
  it("preserves landscape source dimensions", () => {
    expect(resolveCameraGeometry(1920, 1080)).toMatchObject({
      width: 1920,
      height: 1080,
      aspectRatio: 16 / 9,
      orientation: "landscape"
    });
  });

  it("reorients when a camera reports portrait dimensions", () => {
    expect(resolveCameraGeometry(1080, 1920)).toMatchObject({
      width: 1080,
      height: 1920,
      aspectRatio: 9 / 16,
      orientation: "portrait"
    });
  });

  it("falls back safely before video metadata is available", () => {
    expect(resolveCameraGeometry(0, 0)).toMatchObject({
      width: 16,
      height: 9,
      orientation: "landscape"
    });
  });
});
