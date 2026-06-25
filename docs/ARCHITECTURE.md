# Architecture

SHORIR AI is a TypeScript PNPM monorepo.

```text
apps/web            React/Vite product UI
apps/api            Express API and backend adapters
packages/contracts  Shared request and response types
packages/content    Static product, report, and presentation content
supabase             Database migrations and local configuration
delegated            Contributor context and bounded task packages
```

## Boundaries

- Frontend features depend on ports such as `ApiClient` and `PoseEstimator`.
- HTTP, MediaPipe, Gemini, Supabase, and static content are adapters behind those ports.
- Shared wire shapes live in `packages/contracts`.
- Live pose video is processed in the browser.
- Phone video uses encrypted WebRTC; the API stores temporary signaling metadata only.
- Meal images are handled temporarily for review and are not part of pose processing.

## Core Flows

1. A persistent anonymous profile ID is created once in the browser.
2. Onboarding updates that profile.
3. Pose coaching calibrates the camera and user, analyzes landmarks locally, then saves derived session data.
4. Meal review accepts desktop or QR phone uploads and returns cautious structured output.
5. Progress aggregates saved sessions for the same profile ID.

## Contribution Boundary

The exercise library is deliberately local-data-driven. Contributors may build it without API, pose, deployment,
or contract changes. Integration owners own routing and shared styles.
