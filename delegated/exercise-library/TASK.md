# Task

Implement the existing `/exercise-library` module.

## Required Data

Complete three guides: squat, push-up, and lunge.

Use the existing `ExerciseGuide` interface in `exerciseGuides.ts`:

```ts
interface ExerciseGuide {
  id: "squat" | "push-up" | "lunge";
  nameEn: string;
  nameBn: string;
  difficulty: "beginner" | "returning" | "intermediate";
  equipment: string[];
  setupSteps: string[];
  movementSteps: string[];
  commonMistakes: string[];
  safetyCues: string[];
  cameraGuidance: string[];
}
```

## Required UI

- Exercise list with English and Bangla names.
- Equipment filter.
- Difficulty filter.
- Selected-exercise detail view.
- Setup, movement, mistakes, safety, and camera sections.
- Useful empty state when filters match nothing.
- Mobile and desktop layouts.

Use local React state only. Do not add API calls, routing, dependencies, or pose logic.
