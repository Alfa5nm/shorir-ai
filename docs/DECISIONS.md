# Decisions

## Modular Monorepo

Use a monorepo with separate frontend, backend, shared contracts, and shared content packages. This keeps feature work independent and makes final packaging easier.

## Ports And Adapters

Vendor tools must be isolated behind adapters:

- Supabase implements the backend `Database` port later.
- Gemini implements the backend `AICoach` port later.
- MediaPipe implements the frontend `PoseEstimator` port later.

## Backend Requirement

The rulebook explicitly requires both frontend and backend. The scaffold includes a real Express backend with memory fallback so local development works before Supabase/Gemini credentials are added.

## Privacy Boundary

Live pose analysis stays browser-side. The backend stores derived session and review data, not raw video.

## Research Lock - Phase 2

- Use MediaPipe Pose Landmarker Web as the primary pose adapter; keep MoveNet Lightning as fallback.
- Use Gemini only from the backend through the AI coach adapter.
- Use structured Gemini outputs for coach and meal reviews.
- Support both Gemini API key mode and Google Cloud ADC / Agent Platform mode in the backend adapter.
- Use Supabase through the backend database adapter; keep memory adapter for local fallback.
- Use QR upload handoff for meal images, not live phone-camera streaming.
- Calibrate squat depth and activity area per camera setup. Monocular camera distance is treated as a relative
  body-segment scale compared with the standing calibration, not as absolute physical depth.
- Defer RAG, Hugging Face classifiers, raw image storage, and custom model training until after the final-round MVP.

## Local Supabase Scope

- Use the `55420-55429` local Supabase port range for SHORIR AI to avoid conflicts with other local Supabase projects.
- Keep Supabase Analytics disabled locally because it is not required for the MVP and adds Windows Docker setup friction.
- Keep Supabase Edge Runtime disabled locally because the product backend is currently Express-based and does not need Edge Functions.
- Use explicit SQL grants for API roles instead of relying on automatic public table exposure.
