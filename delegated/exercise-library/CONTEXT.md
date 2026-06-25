# Context

SHORIR AI is a Bangla-first, privacy-aware fitness companion for beginners in Bangladesh. The application currently
supports calibrated squat coaching, phone-camera WebRTC, onboarding, meal review, and progress summaries.

This module is educational content, not live pose analysis. It must work entirely from local typed fixture data.

## Existing Design

- Dark work-focused interface.
- Maximum card radius: 8 px.
- Cyan is used for active guidance, warm white for primary text, yellow for caution.
- Use `lucide-react` icons already installed.
- Reuse `StatusPill` from `../../components/ui/StatusPill`.
- Keep layouts compact and responsive; do not build a marketing landing page.

## Safety

- Do not diagnose injuries or promise outcomes.
- Use language such as “stop if you feel pain” and “consider professional guidance.”
- Keep instructions cautious and beginner-friendly.
