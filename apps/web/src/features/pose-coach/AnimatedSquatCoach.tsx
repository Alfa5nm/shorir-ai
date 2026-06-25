import { Pause, Play, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SquatPhase = "idle" | "standing_ready" | "descending" | "bottom" | "ascending";
type CoachMode = "demonstrate" | "adaptive";

interface AnimatedSquatCoachProps {
  phase: SquatPhase;
  confidence: number;
  kneeAngle: number | null;
  isTracking: boolean;
}

interface Point {
  x: number;
  y: number;
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function mixPoint(from: Point, to: Point, progress: number): Point {
  return { x: mix(from.x, to.x, progress), y: mix(from.y, to.y, progress) };
}

function demoProgress(elapsed: number) {
  const cycle = elapsed % 5_200;
  if (cycle < 900) {
    return 0;
  }
  if (cycle < 2_400) {
    return (cycle - 900) / 1_500;
  }
  if (cycle < 3_100) {
    return 1;
  }
  if (cycle < 4_600) {
    return 1 - (cycle - 3_100) / 1_500;
  }
  return 0;
}

function adaptiveTarget(phase: SquatPhase, kneeAngle: number | null, confidence: number, current: number) {
  if (confidence < 0.55 || kneeAngle === null) {
    return current;
  }

  const userDepth = Math.min(1, Math.max(0, (165 - kneeAngle) / 70));
  if (phase === "descending") {
    return Math.min(1, userDepth + 0.14);
  }
  if (phase === "bottom") {
    return 1;
  }
  if (phase === "ascending") {
    return Math.max(0, userDepth - 0.14);
  }
  return 0;
}

function drawLine(context: CanvasRenderingContext2D, from: Point, to: Point, color: string, width: number) {
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = "round";
  context.stroke();
}

function drawJoint(context: CanvasRenderingContext2D, point: Point, radius: number, color: string) {
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
}

function renderCoach(canvas: HTMLCanvasElement, progress: number) {
  const scale = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width === 0 || height === 0) {
    return;
  }

  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  context.scale(scale, scale);
  context.clearRect(0, 0, width, height);

  const baseWidth = 360;
  const baseHeight = 300;
  const drawScale = Math.min(width / baseWidth, height / baseHeight);
  const offsetX = (width - baseWidth * drawScale) / 2;
  const offsetY = (height - baseHeight * drawScale) / 2;
  context.translate(offsetX, offsetY);
  context.scale(drawScale, drawScale);

  const ankle = { x: 205, y: 267 };
  const heel = { x: 177, y: 267 };
  const toe = { x: 238, y: 267 };
  const knee = mixPoint({ x: 203, y: 184 }, { x: 246, y: 220 }, progress);
  const hip = mixPoint({ x: 201, y: 108 }, { x: 151, y: 190 }, progress);
  const shoulder = mixPoint({ x: 201, y: 58 }, { x: 134, y: 123 }, progress);
  const elbow = mixPoint({ x: 225, y: 103 }, { x: 190, y: 146 }, progress);
  const wrist = mixPoint({ x: 226, y: 150 }, { x: 249, y: 145 }, progress);
  const head = mixPoint({ x: 201, y: 31 }, { x: 121, y: 95 }, progress);

  context.strokeStyle = "rgba(255, 248, 234, 0.16)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(54, 269);
  context.lineTo(306, 269);
  context.stroke();

  const body = "#fff8ea";
  const active = "#00d2ff";
  const accent = "#f4cf67";

  drawLine(context, shoulder, hip, body, 13);
  drawLine(context, hip, knee, active, 14);
  drawLine(context, knee, ankle, active, 14);
  drawLine(context, heel, toe, body, 10);
  drawLine(context, shoulder, elbow, body, 10);
  drawLine(context, elbow, wrist, body, 10);

  drawJoint(context, head, 18, accent);
  drawJoint(context, shoulder, 7, body);
  drawJoint(context, hip, 8, active);
  drawJoint(context, knee, 8, accent);
  drawJoint(context, ankle, 7, body);

  context.fillStyle = "rgba(0, 210, 255, 0.13)";
  context.beginPath();
  context.arc(knee.x, knee.y, 25, 0, Math.PI * 2);
  context.fill();
}

export function AnimatedSquatCoach({
  phase,
  confidence,
  kneeAngle,
  isTracking
}: AnimatedSquatCoachProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(0);
  const startedAtRef = useRef(performance.now());
  const [mode, setMode] = useState<CoachMode>("demonstrate");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isTracking) {
      setMode("adaptive");
    }
  }, [isTracking]);

  useEffect(() => {
    let animationFrameId = 0;

    const animate = (timestamp: number) => {
      let target = progressRef.current;
      if (!isPaused) {
        target =
          mode === "demonstrate"
            ? demoProgress(timestamp - startedAtRef.current)
            : adaptiveTarget(phase, kneeAngle, confidence, progressRef.current);
      }
      progressRef.current += (target - progressRef.current) * (mode === "adaptive" ? 0.09 : 0.12);
      if (canvasRef.current) {
        renderCoach(canvasRef.current, progressRef.current);
      }
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animationFrameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [confidence, isPaused, kneeAngle, mode, phase]);

  const cue =
    mode === "demonstrate"
      ? "Watch the hip move back, knees bend, chest stays controlled, then drive up."
      : confidence < 0.55
        ? "I will pause until your full body is visible."
        : phase === "descending"
          ? "Follow me down with control."
          : phase === "bottom"
            ? "Match this depth, then drive up."
            : phase === "ascending"
              ? "Stand tall with me."
              : "Stand ready. I will move with you.";

  function selectMode(nextMode: CoachMode) {
    startedAtRef.current = performance.now();
    progressRef.current = 0;
    setIsPaused(false);
    setMode(nextMode);
  }

  return (
    <section className="animated-coach" aria-label="Animated squat coach">
      <div className="animated-coach__header">
        <div>
          <span>Movement guide</span>
          <strong>{mode === "adaptive" ? "Adapting to you" : "Squat demonstration"}</strong>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={() => setIsPaused((value) => !value)}
          aria-label={isPaused ? "Resume coach animation" : "Pause coach animation"}
          title={isPaused ? "Resume animation" : "Pause animation"}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
        </button>
      </div>

      <canvas ref={canvasRef} className="animated-coach__canvas" aria-hidden="true" />

      <div className="animated-coach__modes" aria-label="Coach animation mode">
        <button
          type="button"
          className={mode === "demonstrate" ? "is-active" : ""}
          onClick={() => selectMode("demonstrate")}
        >
          <RefreshCw size={16} />
          Demonstrate
        </button>
        <button
          type="button"
          className={mode === "adaptive" ? "is-active" : ""}
          onClick={() => selectMode("adaptive")}
        >
          Adapt to me
        </button>
      </div>
      <p>{cue}</p>
    </section>
  );
}
