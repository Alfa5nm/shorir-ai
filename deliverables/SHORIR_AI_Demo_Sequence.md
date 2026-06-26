# SHORIR AI Interactive Demo Sequence

Live website: https://shorir-ai-production.up.railway.app

Use `/demo` as the main presentation surface. The route auto-plays through the product loop with real app frames, animated cursor movement, focal highlights, and presenter-safe pause/back/next controls.

## Guided Tour Scenes

1. Profile setup - `/onboarding`
   - Focus: the layered onboarding form.
   - Message: language, goal, schedule, body metrics, and safety become personalization context.

2. Daily command center - `/`
   - Focus: the dashboard plan area.
   - Message: the first screen answers what the user should do next.

3. Strict pose coach - `/coach?exercise=squat`
   - Focus: camera viewport and guided coaching workspace.
   - Message: stable posture and ordered movement are required before reps count.

4. Movement library - `/exercise-library`
   - Focus: guide details and coach entry points.
   - Message: beginners can learn setup, camera position, and safety before tracking.

5. Bangladeshi diet chart - `/diet-chart`
   - Focus: local meal plan and macro sections.
   - Message: nutrition planning uses familiar foods while staying advisory.

6. Calorie check - `/calorie-check`
   - Focus: upload and phone-capture review flow.
   - Message: meal analysis returns cautious estimates, confidence, and next action.

7. Progress review - `/progress`
   - Focus: session history and detector quality.
   - Message: users see what was accepted, paused, rejected, and improved.

8. Submission package - `/about-competition`
   - Focus: competition and artifact summary.
   - Message: the live link, deck, report, demo video, and source package are ready.

## Presenter Flow

- Let the tour auto-play for the first pass, then pause on Pose Coach for the core technical explanation.
- Use Back/Next when judges ask about a route; use Open live route only when deeper inspection is needed.
- Keep the story product-led: onboarding creates context, coaching validates movement, nutrition supports daily use, progress closes the loop.
- Reduced-motion users still see static focal highlights without cursor travel or animated progress.

## Acceptance Checks

- `/demo` does not show static instruction cards or action/result grids.
- The active route frame, focal highlight, cursor, caption, and progress bar are visible on desktop and mobile.
- Controls remain clickable and captions do not block the active focus point.
- Light mode, dark mode, and reduced-motion mode remain readable.
- Release frames, video, presentation, report, and source ZIP are regenerated from the updated UI.
