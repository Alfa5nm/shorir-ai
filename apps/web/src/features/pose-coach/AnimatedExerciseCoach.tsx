import { Pause, Play, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LanguagePreference } from "@shorir/contracts";
import type { ExercisePhase, SupportedExercise } from "./exerciseAnalyzer";
import { localizedCoachCopy } from "./coachingLanguage";

type CoachMode = "demonstrate" | "adaptive";

interface AnimatedExerciseCoachProps {
  exercise: SupportedExercise;
  phase: ExercisePhase;
  confidence: number;
  primaryAngle: number | null;
  isTracking: boolean;
  language: LanguagePreference;
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
  if (cycle < 900) return 0;
  if (cycle < 2_400) return (cycle - 900) / 1_500;
  if (cycle < 3_100) return 1;
  if (cycle < 4_600) return 1 - (cycle - 3_100) / 1_500;
  return 0;
}

function adaptiveTarget(
  exercise: SupportedExercise,
  phase: ExercisePhase,
  primaryAngle: number | null,
  confidence: number,
  current: number
) {
  if (confidence < 0.55 || primaryAngle === null) return current;
  const topAngle = 165;
  const range = exercise === "push-up" ? 85 : exercise === "lunge" ? 80 : 70;
  const userDepth = Math.min(1, Math.max(0, (topAngle - primaryAngle) / range));
  if (phase === "descending") return Math.min(1, userDepth + 0.14);
  if (phase === "bottom") return 1;
  if (phase === "ascending") return Math.max(0, userDepth - 0.14);
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

function drawSquat(context: CanvasRenderingContext2D, progress: number) {
  const ankle = { x: 205, y: 267 };
  const heel = { x: 177, y: 267 };
  const toe = { x: 238, y: 267 };
  const knee = mixPoint({ x: 203, y: 184 }, { x: 246, y: 220 }, progress);
  const hip = mixPoint({ x: 201, y: 108 }, { x: 151, y: 190 }, progress);
  const shoulder = mixPoint({ x: 201, y: 58 }, { x: 134, y: 123 }, progress);
  const elbow = mixPoint({ x: 225, y: 103 }, { x: 190, y: 146 }, progress);
  const wrist = mixPoint({ x: 226, y: 150 }, { x: 249, y: 145 }, progress);
  const head = mixPoint({ x: 201, y: 31 }, { x: 121, y: 95 }, progress);
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
}

function drawPushUp(context: CanvasRenderingContext2D, progress: number) {
  const body = "#fff8ea";
  const active = "#00d2ff";
  const accent = "#f4cf67";
  const wrist = { x: 112, y: 250 };
  const ankle = { x: 292, y: 247 };
  const shoulder = mixPoint({ x: 119, y: 132 }, { x: 146, y: 205 }, progress);
  const elbow = mixPoint({ x: 112, y: 190 }, { x: 78, y: 213 }, progress);
  const hip = mixPoint({ x: 208, y: 151 }, { x: 215, y: 207 }, progress);
  const head = mixPoint({ x: 87, y: 118 }, { x: 112, y: 194 }, progress);

  drawLine(context, shoulder, hip, body, 13);
  drawLine(context, hip, ankle, active, 14);
  drawLine(context, shoulder, elbow, active, 12);
  drawLine(context, elbow, wrist, active, 12);
  drawLine(context, wrist, { x: 82, y: 250 }, body, 9);
  drawLine(context, ankle, { x: 320, y: 252 }, body, 9);
  drawJoint(context, head, 18, accent);
  drawJoint(context, shoulder, 8, body);
  drawJoint(context, elbow, 8, accent);
  drawJoint(context, wrist, 7, body);
  drawJoint(context, hip, 8, active);
  drawJoint(context, ankle, 7, body);
}

function drawLunge(context: CanvasRenderingContext2D, progress: number) {
  const body = "#fff8ea";
  const active = "#00d2ff";
  const accent = "#f4cf67";
  const frontAnkle = { x: 246, y: 264 };
  const rearAnkle = { x: 106, y: 264 };
  const hip = mixPoint({ x: 176, y: 108 }, { x: 176, y: 178 }, progress);
  const shoulder = mixPoint({ x: 176, y: 55 }, { x: 176, y: 121 }, progress);
  const frontKnee = mixPoint({ x: 205, y: 184 }, { x: 238, y: 218 }, progress);
  const rearKnee = mixPoint({ x: 147, y: 185 }, { x: 125, y: 224 }, progress);
  const head = mixPoint({ x: 176, y: 29 }, { x: 176, y: 95 }, progress);

  drawLine(context, shoulder, hip, body, 13);
  drawLine(context, hip, frontKnee, active, 14);
  drawLine(context, frontKnee, frontAnkle, active, 14);
  drawLine(context, hip, rearKnee, body, 12);
  drawLine(context, rearKnee, rearAnkle, body, 12);
  drawLine(context, rearAnkle, { x: 83, y: 264 }, body, 9);
  drawLine(context, frontAnkle, { x: 276, y: 264 }, body, 9);
  drawJoint(context, head, 18, accent);
  drawJoint(context, hip, 8, active);
  drawJoint(context, frontKnee, 8, accent);
  drawJoint(context, rearKnee, 7, body);
}

function renderCoach(canvas: HTMLCanvasElement, exercise: SupportedExercise, progress: number) {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width === 0 || height === 0) return;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.scale(pixelRatio, pixelRatio);
  context.clearRect(0, 0, width, height);
  const drawScale = Math.min(width / 360, height / 300);
  context.translate((width - 360 * drawScale) / 2, (height - 300 * drawScale) / 2);
  context.scale(drawScale, drawScale);
  context.strokeStyle = "rgba(255, 248, 234, 0.16)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(42, 255);
  context.lineTo(326, 255);
  context.stroke();
  if (exercise === "squat") drawSquat(context, progress);
  else if (exercise === "lunge") drawLunge(context, progress);
  else drawPushUp(context, progress);
}

export function AnimatedExerciseCoach({
  exercise,
  phase,
  confidence,
  primaryAngle,
  isTracking,
  language
}: AnimatedExerciseCoachProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(0);
  const startedAtRef = useRef(performance.now());
  const [mode, setMode] = useState<CoachMode>("demonstrate");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    progressRef.current = 0;
    startedAtRef.current = performance.now();
    setMode(isTracking ? "adaptive" : "demonstrate");
  }, [exercise, isTracking]);

  useEffect(() => {
    let animationFrameId = 0;
    const animate = (timestamp: number) => {
      let target = progressRef.current;
      if (!isPaused) {
        target =
          mode === "demonstrate"
            ? demoProgress(timestamp - startedAtRef.current)
            : adaptiveTarget(exercise, phase, primaryAngle, confidence, progressRef.current);
      }
      progressRef.current += (target - progressRef.current) * (mode === "adaptive" ? 0.09 : 0.12);
      if (canvasRef.current) renderCoach(canvasRef.current, exercise, progressRef.current);
      animationFrameId = window.requestAnimationFrame(animate);
    };
    animationFrameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [confidence, exercise, isPaused, mode, phase, primaryAngle]);

  const exerciseName = exercise === "squat" ? "Squat" : exercise === "lunge" ? "Lunge" : "Push-up";
  const cue =
    mode === "demonstrate"
      ? exercise === "squat"
        ? "Watch the hip move back, knees bend, chest stays controlled, then drive up."
        : exercise === "lunge"
          ? "Watch the split stance lower vertically, then drive through the front foot."
          : "Watch the straight plank lower as the elbows bend, then press back to the top."
      : confidence < 0.55
        ? "I will pause until the required joints are visible."
        : phase === "descending"
          ? "Follow me down with control."
          : phase === "bottom"
            ? "Match this depth, then drive up."
            : phase === "ascending"
              ? "Return smoothly to the top."
              : exercise === "push-up"
                ? "Hold a straight top plank. I will move with you."
                : exercise === "lunge"
                  ? "Stand tall with space to step forward. I will move with you."
                : "Stand ready. I will move with you.";
  const banglaCue =
    mode === "demonstrate"
      ? exercise === "squat"
        ? "হিপ পেছনে নিন, হাঁটু বাঁকান, তারপর নিয়ন্ত্রণ রেখে উঠে দাঁড়ান।"
        : exercise === "lunge"
          ? "স্প্লিট স্ট্যান্সে সোজা নিচে নামুন, তারপর সামনের পা দিয়ে ওপরে উঠুন।"
          : "শরীর সোজা রেখে কনুই বাঁকিয়ে নিচে নামুন, তারপর ওপরে চাপ দিন।"
      : confidence < 0.55
        ? "প্রয়োজনীয় জয়েন্ট দেখা না যাওয়া পর্যন্ত আমি অপেক্ষা করব।"
        : phase === "descending"
          ? "নিয়ন্ত্রণ রেখে আমার সঙ্গে নিচে নামুন।"
          : phase === "bottom"
            ? "এই গভীরতা ধরে রেখে ওপরে উঠুন।"
            : phase === "ascending"
              ? "ধীরে শুরুর অবস্থানে ফিরুন।"
              : exercise === "push-up"
                ? "শরীর সোজা রেখে টপ প্ল্যাঙ্ক ধরে রাখুন।"
                : exercise === "lunge"
                  ? "সামনে পা দেওয়ার জায়গা রেখে সোজা দাঁড়ান।"
                  : "সোজা দাঁড়িয়ে প্রস্তুত থাকুন।";

  function selectMode(nextMode: CoachMode) {
    startedAtRef.current = performance.now();
    progressRef.current = 0;
    setIsPaused(false);
    setMode(nextMode);
  }

  return (
    <section className="animated-coach" aria-label={`Animated ${exerciseName.toLowerCase()} coach`}>
      <div className="animated-coach__header">
        <div>
          <span>Movement guide</span>
          <strong>{mode === "adaptive" ? "Adapting to you" : `${exerciseName} demonstration`}</strong>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={() => setIsPaused((value) => !value)}
          aria-label={isPaused ? "Resume coach animation" : "Pause coach animation"}
        >
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
        </button>
      </div>
      <canvas ref={canvasRef} className="animated-coach__canvas" aria-hidden="true" />
      <div className="animated-coach__modes" aria-label="Coach animation mode">
        <button type="button" className={mode === "demonstrate" ? "is-active" : ""} onClick={() => selectMode("demonstrate")}>
          <RefreshCw size={16} />
          Demonstrate
        </button>
        <button type="button" className={mode === "adaptive" ? "is-active" : ""} onClick={() => selectMode("adaptive")}>
          Adapt to me
        </button>
      </div>
      <p>{localizedCoachCopy(cue, banglaCue, language)}</p>
    </section>
  );
}
