import { Activity, Apple, BarChart3, Camera, CheckCircle2, Dumbbell, ScanLine, Settings2 } from "lucide-react";
import type { ComponentType } from "react";

export interface DemoPoint {
  x: number;
  y: number;
}

export interface DemoTargetRect extends DemoPoint {
  width: number;
  height: number;
}

export interface DemoScene {
  id: string;
  title: string;
  route: string;
  frame: string;
  caption: string;
  callout: string;
  targetRect: DemoTargetRect;
  cursorPath: [DemoPoint, DemoPoint];
  durationMs: number;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>;
}

export const demoSequence: DemoScene[] = [
  {
    id: "profile",
    title: "Profile setup",
    route: "/onboarding",
    frame: "/demo-frames/00-onboarding.png",
    caption: "The first touchpoint starts with one guided profile layer instead of a long setup wall.",
    callout: "Language, goal, schedule, body metrics, and safety all become personalized context.",
    targetRect: { x: 6, y: 22, width: 40, height: 46 },
    cursorPath: [{ x: 86, y: 24 }, { x: 25, y: 48 }],
    durationMs: 6200,
    icon: Settings2
  },
  {
    id: "dashboard",
    title: "Daily command center",
    route: "/",
    frame: "/demo-frames/01-dashboard.png",
    caption: "The dashboard answers the first user question immediately: what should I do next?",
    callout: "Plan cards, safety context, and shortcuts stay scan-friendly for first-time users.",
    targetRect: { x: 5, y: 20, width: 54, height: 34 },
    cursorPath: [{ x: 80, y: 20 }, { x: 32, y: 36 }],
    durationMs: 6000,
    icon: Activity
  },
  {
    id: "coach",
    title: "Strict pose coach",
    route: "/coach?exercise=squat",
    frame: "/demo-frames/03-coach.png",
    caption: "Camera, movement guide, and rep controls are separated so testers see exactly what is being judged.",
    callout: "False reps are avoided with quality gates, stable posture, and ordered movement phases.",
    targetRect: { x: 3, y: 27, width: 47, height: 36 },
    cursorPath: [{ x: 88, y: 30 }, { x: 38, y: 42 }],
    durationMs: 6800,
    icon: Camera
  },
  {
    id: "library",
    title: "Movement library",
    route: "/exercise-library",
    frame: "/demo-frames/04-exercises.png",
    caption: "The exercise library gives setup, safety, and camera guidance before the live coach starts.",
    callout: "Supported guides can jump directly into the strict live coach route.",
    targetRect: { x: 32, y: 24, width: 53, height: 48 },
    cursorPath: [{ x: 14, y: 28 }, { x: 73, y: 50 }],
    durationMs: 6000,
    icon: Dumbbell
  },
  {
    id: "diet",
    title: "Bangladeshi diet chart",
    route: "/diet-chart",
    frame: "/demo-frames/05-diet.png",
    caption: "Nutrition feels local: familiar meals, calorie ranges, and macros are organized into a calm plan.",
    callout: "The product stays clear that this is planning guidance, not medical advice.",
    targetRect: { x: 5, y: 26, width: 88, height: 34 },
    cursorPath: [{ x: 82, y: 20 }, { x: 49, y: 42 }],
    durationMs: 5900,
    icon: Apple
  },
  {
    id: "calorie",
    title: "Calorie check",
    route: "/calorie-check",
    frame: "/demo-frames/06-calorie.png",
    caption: "Food review supports desktop upload and phone capture without forcing a separate mobile app.",
    callout: "The result emphasizes cautious estimates, confidence, and next action.",
    targetRect: { x: 5, y: 30, width: 66, height: 44 },
    cursorPath: [{ x: 83, y: 24 }, { x: 37, y: 54 }],
    durationMs: 6200,
    icon: ScanLine
  },
  {
    id: "progress",
    title: "Progress review",
    route: "/progress",
    frame: "/demo-frames/07-progress.png",
    caption: "Progress closes the loop by showing sessions, coach reviews, and detector quality trends.",
    callout: "Users can see what was accepted, paused, rejected, and improved over time.",
    targetRect: { x: 4, y: 24, width: 90, height: 48 },
    cursorPath: [{ x: 88, y: 26 }, { x: 54, y: 48 }],
    durationMs: 5900,
    icon: BarChart3
  },
  {
    id: "submission",
    title: "Submission package",
    route: "/demo?scene=submission",
    frame: "/demo-frames/08-submission.png",
    caption: "The final scene points judges back to the upload-ready files: live URL, deck, report, and source ZIP.",
    callout: "Judges get a complete product story and a complete delivery package.",
    targetRect: { x: 8, y: 24, width: 58, height: 52 },
    cursorPath: [{ x: 88, y: 22 }, { x: 46, y: 50 }],
    durationMs: 6200,
    icon: CheckCircle2
  }
];
