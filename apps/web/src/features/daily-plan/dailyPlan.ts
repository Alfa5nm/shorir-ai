import type { ExerciseType, Profile, WorkoutSession } from "@shorir/contracts";

export interface DailyPlanItem {
  exercise: ExerciseType;
  name: string;
  targetReps: number;
  sets: number;
  note: string;
}

export interface DailyWorkoutPlan {
  isTrainingDay: boolean;
  title: string;
  rationale: string;
  estimatedMinutes: number;
  items: DailyPlanItem[];
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function recentExerciseCounts(sessions: WorkoutSession[]) {
  return sessions.slice(0, 8).reduce<Record<ExerciseType, number>>(
    (counts, session) => ({ ...counts, [session.exercise]: counts[session.exercise] + 1 }),
    { squat: 0, "push-up": 0, lunge: 0 }
  );
}

function baseTarget(profile: Profile) {
  if (profile.fitnessLevel === "intermediate") return { sets: 3, reps: 10 };
  if (profile.fitnessLevel === "returning") return { sets: 2, reps: 8 };
  return { sets: 2, reps: 6 };
}

export function createDailyWorkoutPlan(
  profile: Profile,
  sessions: WorkoutSession[],
  date = new Date()
): DailyWorkoutPlan {
  const today = dayNames[date.getDay()]!;
  const scheduled = profile.weeklySchedule.length === 0 || profile.weeklySchedule.includes(today);
  if (!scheduled) {
    return {
      isTrainingDay: false,
      title: "Recovery day",
      rationale: `Your saved schedule does not include ${today}. Use light walking or mobility if comfortable.`,
      estimatedMinutes: 8,
      items: []
    };
  }

  if (profile.safety.hasPain) {
    return {
      isTrainingDay: true,
      title: "Conservative movement check",
      rationale: "You reported pain or a movement limitation. Keep the session short and stop if symptoms increase.",
      estimatedMinutes: 6,
      items: [
        {
          exercise: "squat",
          name: "Supported range squat",
          targetReps: 4,
          sets: 1,
          note: "Use a pain-free range and stable support. This is not medical guidance."
        }
      ]
    };
  }

  const target = baseTarget(profile);
  const counts = recentExerciseCounts(sessions);
  const goal = profile.goal.toLowerCase();
  const ordered: ExerciseType[] = goal.includes("upper") || goal.includes("push")
    ? ["push-up", "squat", "lunge"]
    : goal.includes("leg") || goal.includes("lower")
      ? ["squat", "lunge", "push-up"]
      : (["squat", "push-up", "lunge"] as ExerciseType[]).sort((a, b) => counts[a] - counts[b]);
  const exerciseNames: Record<ExerciseType, string> = {
    squat: "Bodyweight squat",
    "push-up": "Push-up",
    lunge: "Forward lunge"
  };

  const items = ordered.slice(0, profile.fitnessLevel === "beginner" ? 2 : 3).map((exercise, index) => ({
    exercise,
    name: exerciseNames[exercise],
    targetReps: Math.max(4, target.reps - index * 2),
    sets: target.sets,
    note:
      exercise === "lunge"
        ? "Complete the target on each side with a stable split stance."
        : "Use the live coach and stop the set when form becomes unstable."
  }));

  return {
    isTrainingDay: true,
    title: goal.includes("strength") || goal.includes("muscle") ? "Strength foundation" : "Today's guided session",
    rationale: `Built for your ${profile.fitnessLevel} level and balanced against your recent coached sessions.`,
    estimatedMinutes: items.reduce((minutes, item) => minutes + item.sets * 3, 3),
    items
  };
}
