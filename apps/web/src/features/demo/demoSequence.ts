import { Activity, Apple, BarChart3, Camera, CheckCircle2, Dumbbell, ScanLine, Settings2 } from "lucide-react";
import type { ComponentType } from "react";

export interface DemoStep {
  id: string;
  title: string;
  route: string;
  action: string;
  result: string;
  presenterCue: string;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>;
}

export const demoSequence: DemoStep[] = [
  {
    id: "profile",
    title: "Create a clean profile",
    route: "/onboarding",
    action: "Enter goal, training days, equipment, body metrics, and safety notes.",
    result: "The product personalizes training and diet without requiring an account.",
    presenterCue: "Start here so every following screen feels tailored.",
    icon: Settings2
  },
  {
    id: "dashboard",
    title: "Review today's plan",
    route: "/",
    action: "Open the dashboard and scan the plan, time estimate, and shortcuts.",
    result: "The first screen answers what to do next.",
    presenterCue: "This is the home base for a first-time user.",
    icon: Activity
  },
  {
    id: "coach",
    title: "Run a strict coached set",
    route: "/coach?exercise=squat",
    action: "Choose squat, push-up, or lunge; start camera; follow the live cue.",
    result: "Only stable, ordered, full-depth repetitions are counted.",
    presenterCue: "Show the stage, rep rail, and Guide/Setup/Diagnostics tabs.",
    icon: Camera
  },
  {
    id: "library",
    title: "Check movement guidance",
    route: "/exercise-library",
    action: "Filter exercises and open a guide with setup, safety, and camera notes.",
    result: "Beginners can learn before starting live tracking.",
    presenterCue: "Use the live coach link from a supported guide.",
    icon: Dumbbell
  },
  {
    id: "diet",
    title: "Generate the diet chart",
    route: "/diet-chart",
    action: "Open personalized Bangladeshi meals and macro targets.",
    result: "Food planning uses familiar meals instead of generic global examples.",
    presenterCue: "Call out that it is planning guidance, not medical advice.",
    icon: Apple
  },
  {
    id: "calorie",
    title: "Check calories from a photo",
    route: "/calorie-check",
    action: "Upload from desktop or scan the QR to capture from phone.",
    result: "The AI returns cautious calories, macros, confidence, and next action.",
    presenterCue: "Show both upload and phone capture paths.",
    icon: ScanLine
  },
  {
    id: "progress",
    title: "Close with progress",
    route: "/progress",
    action: "Review saved sessions, coach reviews, and detection quality.",
    result: "The user sees what was accepted, paused, and improved.",
    presenterCue: "End here to show the product loop is complete.",
    icon: BarChart3
  },
  {
    id: "submission",
    title: "Submission package",
    route: "/about-competition",
    action: "Use the live URL, refreshed deck, technical report, and source ZIP.",
    result: "All required CodeFront submission artifacts are ready.",
    presenterCue: "Close by showing the generated deliverables.",
    icon: CheckCircle2
  }
];
