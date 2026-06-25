# SHORIR AI Demo Sequence

Live website: https://shorir-ai-production.up.railway.app

Use this sequence for a first-time judging walkthrough. It is designed to take 4-5 minutes and shows the complete product loop without exposing every diagnostic panel at once.

## Walkthrough

1. Create a clean profile
   - Route: `/onboarding`
   - Action: enter goal, training days, equipment, body metrics, and safety notes.
   - Result: SHORIR AI personalizes training and diet without requiring an account.

2. Review today's plan
   - Route: `/`
   - Action: open the dashboard and scan the plan, time estimate, and shortcuts.
   - Result: the first screen answers what the user should do next.

3. Run a strict coached set
   - Route: `/coach?exercise=squat`
   - Action: choose squat, push-up, or lunge; start camera; follow the live cue.
   - Result: only stable, ordered, full-depth repetitions are counted.

4. Check movement guidance
   - Route: `/exercise-library`
   - Action: filter exercises and open a guide with setup, safety, and camera notes.
   - Result: beginners can learn before starting live tracking.

5. Generate the diet chart
   - Route: `/diet-chart`
   - Action: open personalized Bangladeshi meals and macro targets.
   - Result: food planning uses familiar meals instead of generic global examples.

6. Check calories from a photo
   - Route: `/calorie-check`
   - Action: upload from desktop or scan the QR to capture from phone.
   - Result: the AI returns cautious calories, macros, confidence, and next action.

7. Close with progress
   - Route: `/progress`
   - Action: review saved sessions, coach reviews, and detection quality.
   - Result: the user sees what was accepted, paused, and improved.

8. Submission package
   - Route: `/about-competition`
   - Action: show the live URL, refreshed deck, technical report, demo video, and source ZIP.
   - Result: all required CodeFront submission artifacts are ready.

## Presenter Notes

- Open with the dashboard and explain that the product is a privacy-aware fitness assistant.
- Use the coach screen to show the main innovation: strict pose validation before counting reps.
- Use the Guide, Setup, Diagnostics, and Review tabs to show detail only when needed.
- Show the calorie route after movement coaching to prove the product covers both exercise and nutrition.
- End on progress history and the generated submission deliverables.

## Acceptance Checks

- The header stays compact and does not dominate the first viewport.
- The camera stage is visible without scrolling on a typical laptop viewport.
- Start, stop, confidence, phase, and rep count remain visible during coaching.
- Phone QR capture remains accessible inside setup and calorie flows.
- Dark mode remains readable.
- Reduced-motion users do not receive scroll reveal animation.
