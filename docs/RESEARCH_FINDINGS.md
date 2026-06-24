# SHORIR AI Research Findings

Research date: 2026-06-23 Asia/Dhaka

## Executive Recommendation

For the June 26 CodeFront deadline, SHORIR AI should use a pragmatic web-first stack:

- Pose AI: MediaPipe Pose Landmarker Web as the primary browser-side pose estimator.
- Pose fallback: TensorFlow.js MoveNet Lightning if MediaPipe integration or bundle behavior blocks progress.
- Backend AI: Gemini API through backend-only `@google/genai`, using structured JSON outputs.
- Gemini model: use a Flash-class multimodal model for speed and cost. Prefer `gemini-2.5-flash` or the latest stable Flash-class model available in the API key account; avoid Pro unless a specific review fails.
- Database/Auth: Supabase anonymous auth plus Postgres, with Row Level Security for user-owned rows.
- QR flow: `qrcode.react` on desktop, phone route `/capture/:id`, backend image-session expiration, desktop polling.
- Nutrition: use a manually curated Bangladeshi starter food dataset grounded by the Bangladesh Food Composition Table; Gemini should return cautious labels, ranges, uncertainty, and portion questions.
- RAG/embeddings: defer. Use structured prompt context and static content for this deadline.
- Deployment: Railway backend + Vercel frontend is the least risky split.

## Must-Use Now

| Area | Recommendation | Why |
| --- | --- | --- |
| Browser pose | MediaPipe Pose Landmarker Web | Official web docs, 2D + 3D landmarks, designed for image/video body landmark detection. |
| Backend AI | Gemini API through `@google/genai` | Official SDK, supports multimodal inputs and structured outputs. |
| Persistence | Supabase Postgres + anonymous auth | Real backend without full email/password scope. |
| QR | `qrcode.react` | Simple React QR component with SVG/Canvas output. |
| Deployment | Railway API + Vercel web | Common, fast, env-var friendly. |
| Food data | Manual starter dataset + Bangladesh FCT | Local relevance and safer than depending on weak food classifiers. |

## Defer

| Area | Decision | Reason |
| --- | --- | --- |
| RAG/embeddings | Defer | Too little content to justify vector retrieval. Static context is enough. |
| Hugging Face food classifier | Defer | Existing models skew Food-101/Indian, not Bangladeshi; licensing/model quality varies. |
| Raw image storage | Defer | Privacy risk and not needed for judging. Store derived meal-review signals only. |
| Custom model training | Defer | Dataset and validation effort exceed deadline. |
| Full login/payment/trainer dashboard | Defer | Not required for final MVP. |

## 1. Browser Pose Estimation

### Findings

MediaPipe Pose Landmarker detects body landmarks in images and video, outputs image-coordinate landmarks and 3D world landmarks, and is officially supported for Web JavaScript. This matches SHORIR's need to analyze posture and movement locally in the browser.

MoveNet is also strong. TensorFlow describes it as an ultra-fast pose detection model with 17 keypoints, with Lightning optimized for latency and Thunder for accuracy. It is suitable for live fitness/wellness use cases and can run faster than real time on many modern devices.

### Recommendation

Use MediaPipe Pose Landmarker first.

Reason:

- 33 landmarks are better for form heuristics than MoveNet's 17 keypoints.
- Official web guide exists.
- MediaPipe is already aligned with the abstract's posture-inference claim.

Fallback:

- MoveNet Lightning through TensorFlow.js if MediaPipe integration is slow or unstable.

### Implementation Notes

- Keep it inside `apps/web/src/adapters/mediapipePose`.
- Feature code should use only the `PoseEstimator` port.
- Process camera frames client-side.
- Do not upload raw pose frames or video.
- Return normalized pose frames with landmark confidence and timestamp.

### Squat Logic

Use side-facing squat detection for the MVP. Ask the user to stand fully visible, with the camera at roughly hip/chest height if possible.

Initial state machine:

```txt
idle
  -> standing_ready when hips/knees/ankles/shoulders visible and knee angle > 155
standing_ready
  -> descending when knee angle decreases and hip y moves downward
descending
  -> bottom when knee angle < 105 or hip drops below calibrated threshold
bottom
  -> ascending when knee angle increases
ascending
  -> rep_completed when knee angle > 155 and motion stabilizes
```

Confidence rules:

- Minimum keypoint confidence: 0.55 for hip/knee/ankle/shoulder.
- Minimum frame confidence: 0.6.
- If confidence falls below threshold for several frames, show "Cannot assess confidently."
- Do not count reps during low-confidence windows.
- Avoid medical wording; say "try slowing down" or "stand fully in frame," not diagnosis.

## 2. Gemini Backend Usage

### Findings

Gemini API docs recommend creating an API key, setting it as an environment variable, and using the official SDK. The docs also support structured output using JSON Schema and image understanding through inline image data, URLs, or the File API.

Vite exposes `VITE_` variables to client-side code, so the Gemini key must stay in `apps/api`, never `apps/web`.

Gemini pricing and model pages change over time. Current docs list Flash-class models as lower-cost/faster choices and Pro-class models as heavier reasoning models.

### Recommendation

Use `@google/genai` in the backend adapter:

```bash
pnpm --filter @shorir/api add @google/genai
```

Use backend env var:

```txt
GEMINI_API_KEY=...
AI_COACH_ADAPTER=gemini
```

Use structured output for:

- coach review
- meal review

Do not stream Gemini output into the product for MVP. Return structured JSON only.

### Coach Review Schema

```ts
{
  summaryBn: string;
  summaryEn: string;
  nextAction: string;
  formFocus: string[];
  safetyNote: string;
  confidenceLevel: "low" | "medium" | "high";
  encouragement: string;
  limitations: string[];
}
```

### Meal Review Schema

```ts
{
  probableDishes: string[];
  confidenceLevel: "low" | "medium" | "high";
  portionQuestions: string[];
  calorieRange?: string;
  macroNotes: string[];
  profileSignals: string[];
  limitations: string[];
}
```

### Safety Prompt Pattern

```txt
You are SHORIR AI, a non-medical fitness and nutrition assistant.
Return only valid JSON matching the provided schema.
Do not diagnose, treat, or claim medical certainty.
For meal images, provide cautious probable dish labels and ranges only.
Always mention uncertainty around oil, portion size, mixed ingredients, and preparation.
Ask correction questions when evidence is insufficient.
If the input is unsafe or unclear, abstain and explain the limitation.
```

## 3. Meal Image Review And Nutrition Data

### Findings

The Food Composition Table for Bangladesh is available through FAO and is the strongest local nutrition source found. FAO's food composition database directory lists Bangladesh FCT as a country resource. Indian Food Composition Tables are useful as secondary context but should not replace Bangladesh-specific food references.

Food image classification models on Hugging Face are mostly Food-101 or Indian-food oriented. They can be future references but are not reliable enough for Bangladeshi meal estimation in the deadline MVP.

### Recommendation

Implement:

- Manual `bangladeshi_foods.csv` starter dataset with 30-50 common foods.
- Gemini vision review as cautious dish identification and portion-question generator.
- Store derived profile signals only, not raw images.

Starter categories:

- Staples: rice, ruti, paratha, khichuri, tehari.
- Protein: dal, egg bhuna, chicken curry, beef curry, fish curry, hilsa curry.
- Vegetables: mixed vegetables, bhorta, shak.
- Snacks: singara, samosa, fuchka, chotpoti.
- Drinks/sweets: tea, doi, mishti.

Data fields:

```csv
name,category,typical_portion,calorie_range,protein_note,carb_note,fat_note,uncertainty_note
```

### Image Handling

- Accept uploads up to 5 MB.
- Convert to inline base64 for Gemini if within request limits.
- Delete image buffer after processing.
- Persist only structured meal review.

## 4. Supabase Backend

### Findings

Supabase anonymous sign-ins provide authenticated user sessions without requiring PII. Supabase docs state anonymous users get authenticated-role access, not unauthenticated anon-role access. RLS policies therefore still matter.

Supabase RLS is a Postgres-level defense-in-depth mechanism and should be enabled on user-owned tables. Supabase migrations are normal SQL files tracked over time, and the CLI can run local development and migration workflows.

### Recommendation

Use anonymous auth if time allows; otherwise use the existing memory profile ID locally and prepare Supabase schema for deployment.

Tables:

- `profiles`
- `workout_sessions`
- `pose_events`
- `coach_reviews`
- `meal_reviews`
- `image_sessions`

RLS pattern:

- `profile_id = auth.uid()` for user-owned rows if frontend directly uses Supabase auth tokens.
- If all DB access goes through Express service role, keep service key backend-only and enforce ownership in API layer.

For deadline safety, prefer API-mediated access first:

- Frontend talks to Express.
- Express talks to Supabase.
- Supabase service role key stays server-side.
- Add RLS policies before any direct browser Supabase access.

## 5. QR Phone Upload Flow

### Recommendation

Use `qrcode.react`.

Install:

```bash
pnpm --filter @shorir/web add qrcode.react
```

Flow:

1. Desktop calls `POST /api/image-sessions`.
2. Backend creates `image_session` with 30-minute expiry.
3. Desktop renders QR for `${PUBLIC_WEB_URL}/capture/:id`.
4. Phone opens route and uploads/captures image.
5. Backend validates upload and calls Gemini.
6. Desktop polls `GET /api/image-sessions/:id` or a future result endpoint every 2-3 seconds.

Security:

- Expire sessions.
- Limit image size.
- Validate MIME type.
- Do not store raw image by default.
- Bind session to profile ID.
- Show upload status and fallback desktop upload.

Avoid Supabase Realtime for MVP. Polling is simpler and sufficient.

## 6. RAG And Embeddings

### Findings

Gemini embedding docs support semantic search/retrieval, and newer Gemini embedding models include multimodal capabilities. However, SHORIR's MVP knowledge base is small: abstract, rulebook, static food data, safety notes, and prompt guidelines.

### Recommendation

Skip RAG for the June 26 MVP.

Use:

- static prompt context
- curated food CSV
- deterministic schemas
- explicit safety rules

Add future extension point:

- `KnowledgeSource` or `RetrievalPort`
- optional Supabase `pgvector`
- Gemini embeddings later if report needs future scalability.

## 7. Hugging Face Models

### Findings

Useful references:

- Food-101 dataset: large general food dataset, not local enough.
- Indian food image classifiers: closer to region but not Bangladeshi enough and model cards often lack detailed limitations.
- Bangla sentence transformers: useful later for Bangla semantic search, but not necessary now.
- Transformers.js can run models in browser, but adding another model runtime increases scope.

### Recommendation

Do not use Hugging Face models in the MVP.

Mention as future work:

- Bangla embeddings for local-language retrieval.
- Local food classifier after collecting consented Bangladeshi meal images.
- Browser ML via Transformers.js if offline features become important.

## 8. GitHub Repos And Examples

Use repos as implementation references only, not copy-paste sources.

Potential references:

- React/MediaPipe pose demos for webcam setup patterns.
- Python squat counters for angle/state-machine ideas.
- Express/Supabase TypeScript starters for backend structure.
- Gemini official cookbook/samples for API usage.

Important:

- The team must understand and explain all AI-generated or adapted parts.
- Do not include unclear-license code.
- Prefer official docs over repo snippets.

## 9. CLI And Dev Tooling

Required:

```bash
pnpm install
pnpm build
pnpm api:dev
pnpm web:dev
```

Recommended later:

```bash
pnpm --filter @shorir/api add @google/genai @supabase/supabase-js
pnpm --filter @shorir/web add qrcode.react
```

Optional:

- Supabase CLI for migrations/local stack.
- Railway CLI if dashboard deployment is not enough.
- Vercel CLI if frontend deployment needs local linking.

Windows notes:

- Keep env vars in `.env`, not PowerShell history.
- Never commit `.env`.
- Gemini key must not use `VITE_`.

## 10. MCPs / Codex Tools

Useful now:

- Gmail connector: rulebook/task email verification.
- Google Drive connector: asset/rulebook retrieval.
- Browser automation: local UI checks and screenshot QA.
- Documents/Presentations skills: final technical report and presentation generation.

Manual:

- Supabase project credential entry.
- Railway/Vercel account linking.
- Final Google Form submission.

## 11. Deployment

### Backend

Railway:

- Build: `pnpm --filter @shorir/api build`
- Start: `pnpm --filter @shorir/api start`
- Env:
  - `PORT`
  - `CORS_ORIGIN`
  - `DATABASE_ADAPTER=supabase`
  - `AI_COACH_ADAPTER=gemini`
  - `SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - `GEMINI_API_KEY`

Railway injects `PORT`; the app already reads it.

### Frontend

Vercel:

- Build command: `pnpm --filter @shorir/web build`
- Output directory: `apps/web/dist`
- Env:
  - `VITE_API_BASE_URL=https://your-railway-api...`

Do not put Gemini/Supabase service keys in Vercel frontend env.

## 12. Security, Privacy, And Ethics

Checklist:

- Camera frames stay in browser.
- Pose events are derived data only.
- Meal images are temporary by default.
- Store only structured meal review and profile signals.
- Explicitly display uncertainty.
- Stop/pain escalation copy appears when safety flag is set.
- No diagnosis, treatment, or guaranteed calorie accuracy.
- API keys server-side only.
- `.env` ignored.
- Build log records all major AI/tooling decisions.

## 13. Final Report And Presentation

Report should emphasize:

- Rulebook compliance.
- Frontend/backend architecture.
- Ports/adapters modularity.
- Browser-side pose privacy.
- Gemini structured output.
- Supabase persistence.
- QR meal capture.
- Ethical AI boundaries.
- Known limitations.
- Future path: trainer dashboard, richer food dataset, RAG, custom local models.

Demo script:

1. Open SHORIR dashboard with Mindsparks/CodeFront branding.
2. Complete onboarding.
3. Open pose coach and explain browser-side inference.
4. Save session to backend.
5. Generate Gemini coach review.
6. Show QR meal upload flow.
7. Show progress/report page.
8. Close with privacy and feasibility.

## Source Links

- MediaPipe Pose Landmarker overview: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker
- MediaPipe Pose Landmarker Web guide: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js
- TensorFlow MoveNet tutorial: https://www.tensorflow.org/hub/tutorials/movenet
- TensorFlow.js MoveNet README: https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/src/movenet/README.md
- Gemini API docs: https://ai.google.dev/gemini-api/docs
- Gemini quickstart: https://ai.google.dev/gemini-api/docs/quickstart
- Gemini API key docs: https://ai.google.dev/gemini-api/docs/api-key
- Gemini structured output: https://ai.google.dev/gemini-api/docs/structured-output
- Gemini image understanding: https://ai.google.dev/gemini-api/docs/image-understanding
- Gemini embeddings: https://ai.google.dev/gemini-api/docs/embeddings
- Gemini models: https://ai.google.dev/gemini-api/docs/models
- Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- `@google/genai` npm: https://www.npmjs.com/package/@google/genai
- Supabase anonymous auth: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase users / anonymous role note: https://supabase.com/docs/guides/auth/users
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase CLI: https://supabase.com/docs/guides/local-development/cli/getting-started
- Supabase JS GitHub: https://github.com/supabase/supabase-js
- Railway Express guide: https://docs.railway.com/guides/express
- Vercel Vite guide: https://vercel.com/docs/frameworks/frontend/vite
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vite env docs: https://vite.dev/guide/env-and-mode
- `qrcode.react`: https://www.npmjs.com/package/qrcode.react
- Bangladesh Food Composition Table PDF: https://www.fao.org/fileadmin/templates/food_composition/documents/FCT_10_2_14_final_version.pdf
- FAO/INFOODS tables directory: https://www.fao.org/food-composition/tables-and-databases/en
- Indian Food Composition Tables 2017: https://www.nin.res.in/ebooks/IFCT2017.pdf
- Food-101 dataset on Hugging Face: https://huggingface.co/datasets/ethz/food101
- Transformers.js docs: https://huggingface.co/docs/transformers.js/en/index
- Bangla sentence transformer example: https://huggingface.co/shihab17/bangla-sentence-transformer
- Indian food image model example: https://huggingface.co/dima806/indian_food_image_detection
