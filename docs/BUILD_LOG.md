# SHORIR AI Build Log

## 2026-06-23 02:00 Asia/Dhaka - Phase 1 scaffold started

- Action: Inspected the workspace and found only `Documentation/` with the submitted abstract PDFs.
- Action: Created monorepo directories for `apps/web`, `apps/api`, `packages/contracts`, `packages/content`, `docs`, `delegated`, `supabase`, and `scripts`.
- Action: Added root package metadata, workspace config, shared TypeScript config, `.gitignore`, and README.
- Action: Added shared contracts for profiles, sessions, pose events, coach reviews, meal reviews, image sessions, and API responses.
- Action: Added shared content package seeded from the submitted SHORIR AI abstract and CodeFront task requirements.
- Action: Added React/Vite web scaffold with placeholder routes and feature modules.
- Action: Added frontend ports for API, pose estimation, and content source.
- Action: Added frontend adapters for HTTP API, static content, and future MediaPipe pose estimation.
- Action: Added Express API scaffold with modular route registration.
- Action: Added backend ports for database, AI coach, image processing, and object storage.
- Action: Added memory database, stub AI coach, basic image processor, and no-op object storage adapters.
- Action: Downloaded provided branding assets into `apps/web/public/branding`.
- Action: Installed workspace dependencies with PNPM.
- Action: Ran full workspace build.
- Action: Started built API server and verified `GET /api/health`.
- Action: Started Vite web dev server and verified the root page returns HTTP 200.
- Result: Scaffolding is modular and vendor SDKs are isolated behind adapters.
- Result: Full workspace build passes.
- Result: API health endpoint returns `ok: true` using the `memory` database adapter.
- Result: Local web scaffold is available at `http://localhost:5173/`.

## 2026-06-23 02:55 Asia/Dhaka - Research plan added

- Action: Read `Documentation/Research Plan Template & Example.docx`.
- Action: Extracted its headings, paragraph structure, tables, and embedded image metadata.
- Action: Created `docs/RESEARCH_PLAN.md` using the template structure adapted to SHORIR AI, CodeFront requirements, and the current modular scaffold.
- Result: SHORIR now has a research plan that can feed implementation decisions, technical report notes, and presentation planning.

## 2026-06-23 03:20 Asia/Dhaka - Research findings added

- Action: Researched official documentation and high-signal references for browser pose estimation, Gemini API, Supabase, QR upload, deployment, nutrition datasets, Hugging Face models, RAG, and tooling.
- Action: Created `docs/RESEARCH_FINDINGS.md` with recommendations, source links, implementation notes, defer/use-now decisions, privacy guidance, and report/demo implications.
- Action: Updated `docs/DECISIONS.md` with Phase 2 research lock decisions.
- Result: Implementation can proceed with MediaPipe primary pose adapter, backend-only Gemini structured outputs, Supabase through the backend adapter, QR image handoff, and no RAG/custom model training for the deadline.

## 2026-06-23 04:05 Asia/Dhaka - Supabase CLI and Gemini adapter installed

- Action: Installed Supabase CLI as a workspace dev dependency.
- Action: Installed `@google/genai` and `@supabase/supabase-js` in `apps/api`.
- Action: Added root Supabase CLI scripts: `supabase:version`, `supabase:init`, `supabase:start`, and `supabase:status`.
- Action: Implemented `apps/api/src/adapters/gemini/geminiCoach.ts` behind the existing `AICoach` port.
- Action: Added Gemini API-key and ADC/Agent Platform environment configuration to `apps/api/.env.example`.
- Action: Updated deployment docs with Gemini auth modes and Supabase CLI commands.
- Result: `pnpm supabase:version` returns `2.107.0`.
- Result: `pnpm build` passes with the Gemini adapter installed.

### Mistakes / Fixes

- Issue: PowerShell rejected `&&` as a command separator during install.
- Fix: Reran the package installs as separate commands.
- Issue: Registry requests temporarily failed with `EAI_AGAIN` and retried.
- Fix: Let PNPM retry; Supabase CLI install completed.
- Issue: PNPM blocked build scripts for `@google/genai` and `protobufjs`.
- Fix: Added those packages to `onlyBuiltDependencies` and `allowBuilds` in `pnpm-workspace.yaml`.
- Issue: The Gemini adapter initially failed strict TypeScript checks around exact optional properties and defaulted arrays.
- Fix: Split API-key/ADC client construction into explicit branches and normalized parsed Gemini JSON into fully required return objects.

## 2026-06-23 12:15 Asia/Dhaka - Supabase schema and adapter implemented

- Action: Ran `supabase init` to create `supabase/config.toml`.
- Action: Added `supabase/migrations/0001_initial_schema.sql` for profiles, workout sessions, pose events, coach reviews, image sessions, and meal reviews.
- Action: Enabled local anonymous sign-ins in `supabase/config.toml` for the intended future auth path.
- Action: Added `supabase/seed.sql` placeholder.
- Action: Implemented `apps/api/src/adapters/supabase/supabaseDatabase.ts` behind the existing `Database` port.
- Action: Added `SUPABASE_SERVICE_ROLE_KEY` env alias and `supabase:lint` root script.
- Result: `pnpm build` passes with the Supabase adapter.

### Mistakes / Fixes

- Issue: Supabase CLI local migration commands require a running local Postgres service.
- Issue: `pnpm supabase:start` failed because Docker Desktop is not available on this machine.
- Fix: Kept the migration and adapter build-verified; hosted Supabase SQL editor or a Docker-enabled machine can apply and lint the migration.
- Issue: Initial Supabase adapter mapping failed strict TypeScript checks for optional `confidence` and nullable insert results.
- Fix: Added explicit guards and only include optional contract fields when values are defined.

## 2026-06-23 12:29 Asia/Dhaka - Local Supabase verified with Docker Desktop

- Action: Confirmed Docker Desktop was installed but the Docker daemon was not initially reachable.
- Action: Launched Docker Desktop from the user session and waited until `docker info` returned successfully.
- Action: Ran `pnpm supabase:start`; the first run downloaded the local Supabase Docker image set.
- Action: Moved this project's local Supabase ports to the `55420-55429` range in `supabase/config.toml`.
- Action: Disabled optional local Analytics and Edge Runtime services because they are not needed for the MVP backend smoke test.
- Action: Added `supabase/migrations/0002_api_role_grants.sql` so the backend's service-role Supabase client can access the project tables through PostgREST.
- Action: Applied the new grant migration with `pnpm supabase migration up --local`.
- Action: Ran a Supabase-backed API smoke test using `DATABASE_ADAPTER=supabase` and `AI_COACH_ADAPTER=stub`.
- Result: `pnpm supabase:start` succeeds.
- Result: `pnpm supabase:status` reports Project URL `http://127.0.0.1:55421`, database URL `postgresql://postgres:postgres@127.0.0.1:55422/postgres`, Studio `http://127.0.0.1:55423`, and Mailpit `http://127.0.0.1:55424`.
- Result: `pnpm supabase:lint` reports no schema errors.
- Result: Backend smoke test created an anonymous profile, saved a workout session, listed the saved session, and persisted a coach review through Supabase.

### Mistakes / Fixes

- Issue: Initial `pnpm supabase:start` failed because another local Supabase project, `BekarBattleRoyale`, already occupied the default ports `54321-54324` and `54327`.
- Fix: Left the other project untouched and assigned SHORIR AI to local ports `55421-55424`, `55427`, and `55429`.
- Issue: A retry on the `544xx` range still failed on `54424`.
- Fix: Checked listening ports and moved to the clear `554xx` range.
- Issue: Local Supabase Analytics warned that Windows requires Docker daemon TCP exposure on `tcp://localhost:2375`.
- Fix: Disabled Analytics for local SHORIR AI because the MVP does not depend on it.
- Issue: Local Edge Runtime failed health checks because its container could not reach `deno.land` to resolve Deno standard library imports.
- Fix: Disabled Edge Runtime for local SHORIR AI because the MVP backend uses Express routes, not Supabase Edge Functions.
- Issue: The first Supabase-backed API smoke test failed with `permission denied for table profiles`.
- Fix: Added explicit API role grants in `0002_api_role_grants.sql`.

## 2026-06-23 15:15 Asia/Dhaka - Browser pose coach implemented

- Action: Added `@mediapipe/tasks-vision` to the web app.
- Action: Implemented the MediaPipe Pose Landmarker adapter behind the existing frontend `PoseEstimator` port.
- Action: Added browser-side live video processing with normalized landmark mapping and confidence calculation.
- Action: Rebuilt the pose coach feature into a working camera-driven squat coach with rep state, knee-angle readout, confidence readout, feedback, session save, and coach-review generation.
- Action: Kept camera frames browser-side and connected only derived workout summaries to the backend API.
- Action: Verified the coach route renders with video/canvas elements and no initial browser console errors before camera permission.
- Result: `pnpm -r typecheck`, `pnpm -r lint`, and `pnpm build` pass.
- Result: API dev server is running at `http://localhost:4000`; web dev server is running at `http://localhost:5173/`.

### Mistakes / Fixes

- Issue: PNPM initially blocked adding MediaPipe because `node_modules` had stale virtual-store metadata.
- Fix: Ran `pnpm install --force` to recreate workspace dependencies, then added the package.
- Issue: The first coach feature typecheck imported `PoseLandmark` from shared contracts instead of the frontend pose port.
- Fix: Moved the import to `apps/web/src/ports/poseEstimator.ts`.

## Mistakes / Fixes

- Issue: `pnpm install` initially failed with `ERR_PNPM_IGNORED_BUILDS` because `esbuild` build scripts were blocked.
- Fix: First attempted the old `package.json` PNPM policy location, which PNPM 11 ignored. Moved policy direction to workspace handling and used `pnpm approve-builds esbuild` to approve only the required dependency.
- Issue: API build failed because exported Express factory functions inferred non-portable internal Express types.
- Fix: Added explicit `Express` and `Router` return type annotations to app/router factory functions.
- Issue: API build failed because `req.params.id` could be `string | string[] | undefined`.
- Fix: Added route param guards before calling the database port.
- Issue: Web build failed because `StatusPill` accepted only `string` children.
- Fix: Changed `StatusPill` to accept `ReactNode`.
- Issue: Web TypeScript build emitted generated `.js` and `.d.ts` files beside source files because `apps/web/tsconfig.json` did not disable emit.
- Fix: Added `noEmit: true` to the web tsconfig and removed only the generated `apps/web` artifacts after verifying their paths.

## Next Verification

- Test live camera permission and squat counting on a real device/browser.
- Replaced the phone-camera JPEG polling relay with encrypted direct WebRTC video, ICE restart negotiation, and
  optional TURN configuration. The API now carries signaling metadata only and has no frame-upload endpoint.
- Added camera-aware squat calibration: standing samples establish body scale and framing, one comfortable squat
  establishes personal depth, and a learned activity region gates rep counting. Live feedback now detects leaving
  the calibrated box or moving materially closer to/farther from the camera.
- Tune squat thresholds after physical movement testing.
- Add QR meal upload flow implementation.
- Add a real Gemini smoke test once API key or ADC credentials are available in local env.
