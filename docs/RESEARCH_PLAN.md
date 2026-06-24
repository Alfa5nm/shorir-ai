# SHORIR AI Research Plan

## Executive Summary

This research plan defines what Team El Bracino needs to investigate, validate, and document to turn the submitted SHORIR AI abstract into a functional CodeFront final-round product before the June 26, 2026 deadline.

SHORIR AI is a Bangla-first, privacy-aware AI fitness companion for beginner users in Bangladesh. The final-round MVP focuses on a narrow but demonstrable product slice: onboarding, browser-side squat pose coaching, backend session persistence, Gemini-powered coach review, QR/desktop meal-image review, and a progress dashboard. The research must support practical implementation decisions, not broad academic exploration.

The plan prioritizes official documentation, production-feasible libraries, legally usable datasets, privacy-preserving architecture, and explainable AI behavior. It also supports the required competition outputs: live website, presentation, technical report, and source-code ZIP.

## Research Objectives And Aims

### Aim

Determine the most reliable, ethical, and deadline-feasible technical stack for building SHORIR AI as a functional web-based AI product with both frontend and backend.

### Objectives

- Identify the best browser-side pose-estimation model for squat rep counting and basic form feedback.
- Design a safe rule-based squat state machine using pose landmarks and confidence thresholds.
- Select the backend Gemini API usage pattern for structured coach reviews and cautious meal-image reviews.
- Define a Supabase-ready data model for profiles, workout sessions, pose events, coach reviews, meal reviews, and QR upload sessions.
- Find or create a legally safe starter dataset for Bangladeshi/South Asian meal logging.
- Decide whether RAG/embeddings are necessary for this deadline or should be deferred.
- Document privacy, ethics, and safety constraints for camera, image, nutrition, and coaching features.
- Produce research outputs that can feed the final technical report and presentation.

## Scope And Delimitations

### In Scope

- Browser-compatible pose estimation for live squat coaching.
- Backend-only Gemini API usage.
- Supabase Postgres/Auth research and schema planning.
- QR phone upload flow for meal images.
- Manual or AI-assisted Bangladeshi meal review with uncertainty.
- Static/shared content sources for presentation and report pages.
- Deployment research for Railway backend and static frontend hosting.
- Documentation, build log, and final submission packaging.

### Out Of Scope

- Clinical diagnosis, injury treatment, or rehabilitation advice.
- Precise calorie claims from one image.
- Universal exercise recognition.
- Wearable integrations.
- Full trainer dashboard.
- Payment/subscription implementation.
- Custom model training before enough local data exists.
- GPU-heavy models requiring complex ML infrastructure.

## Literature And Technical Review Strategy

Research should prioritize:

- Official product documentation for Gemini, MediaPipe, Supabase, Railway, Vite, and React.
- Maintained GitHub examples only when official docs are insufficient.
- Papers or articles only when they directly inform pose angles, confidence handling, or safe meal-estimation limitations.
- Public datasets only when license and provenance are clear.

Search strategy:

```txt
("MediaPipe Pose Landmarker" OR MoveNet OR "TensorFlow.js pose")
AND ("squat counter" OR "rep counting" OR "pose landmarks")

("Gemini API" OR "@google/genai")
AND ("structured output" OR "JSON schema" OR "image input")

("Bangladeshi food composition" OR "South Asian nutrition dataset")
AND (calorie OR portion OR household)

("Supabase anonymous auth" OR "Supabase RLS")
AND ("Express TypeScript" OR Node)
```

## Data Sources

### Primary Sources

- Official docs:
  - Google Gemini API / Google AI Studio.
  - MediaPipe web vision tasks.
  - TensorFlow.js model docs if MoveNet is evaluated.
  - Supabase Auth, Postgres, RLS, and Storage docs.
  - Railway deployment docs.
  - Vite environment variable docs.
- The submitted SHORIR AI abstract in `Documentation/`.
- CodeFront final-round task PDF and rulebook notes.
- Provided Mindsparks/CodeFront/AUST IDC assets.

### Secondary Sources

- Maintained GitHub examples for React pose estimation and QR uploads.
- Public nutrition tables or datasets for Bangladesh/South Asia.
- Kaggle/Hugging Face datasets only after checking license and quality.
- Research articles or tutorials on pose-angle state machines and food-image uncertainty.

## Inclusion And Exclusion Criteria

### Include

- Browser-side models that run without sending camera frames to a server.
- Libraries with active maintenance, clear install instructions, and permissive usage.
- APIs that can be called from a Node/Express backend using environment variables.
- Datasets with clear licensing and relevant Bangladeshi/South Asian food coverage.
- Examples that can be understood and explained by the team.

### Exclude

- Models requiring Python GPU servers for the MVP.
- Repos without licenses or with stale APIs.
- Nutrition systems that imply clinical precision.
- Camera/image flows that require storing raw video.
- Any implementation that exposes Gemini or Supabase secret keys in frontend code.

## Methodology

Use a mixed technical-product research method:

- Comparative technical review for models, APIs, datasets, and deployment tools.
- Prototype validation for pose model loading, API connectivity, and QR upload flow.
- Risk analysis for privacy, safety, deadline feasibility, and explainability.
- Documentation synthesis for the technical report and presentation.

Each research item should produce:

- Recommended option.
- Fallback option.
- Integration complexity.
- Risks and limitations.
- Source links.
- Implementation notes.

## Research Workstreams

### 1. Browser Pose Estimation

Compare:

- MediaPipe Pose Landmarker Web.
- TensorFlow.js MoveNet.
- BlazePose or other browser-ready models.

Evaluate:

- Client-side execution.
- Landmark quality for squat detection.
- Mid-range Android performance.
- React/Vite integration difficulty.
- Bundle/runtime size.
- Camera permission and fallback behavior.

Expected output:

- MVP recommendation.
- Fallback model.
- Installation notes.
- Landmark mapping needed for hip, knee, ankle, shoulder.

### 2. Squat Rep Counting Logic

Research:

- Knee angle and hip movement thresholds.
- Standing/down/bottom/up state transitions.
- Confidence filtering.
- Conditions for abstaining.
- Safe non-medical feedback language.

Expected output:

- State-machine pseudocode.
- Initial thresholds.
- Feedback codes.
- Failure modes.

### 3. Gemini Backend Usage

Research:

- Current Node SDK.
- Structured JSON output.
- Image input.
- Recommended low-cost model.
- Prompting for safety and uncertainty.
- Rate limits and pricing.

Expected output:

- Gemini adapter design.
- Coach review schema.
- Meal review schema.
- Safety prompt template.

### 4. Meal Review And Nutrition

Research:

- Gemini vision for local meal identification.
- Manual food dataset grounding.
- Bangladeshi/South Asian food sources.
- Portion uncertainty questions.
- Whether raw images should be stored.

Expected output:

- MVP meal-review pipeline.
- Starter food dataset plan.
- Derived-only storage policy.

### 5. Supabase Backend

Research:

- Anonymous auth.
- Server-side service key safety.
- RLS options.
- Migration workflow.
- Tables for:
  - `profiles`
  - `workout_sessions`
  - `pose_events`
  - `coach_reviews`
  - `meal_reviews`
  - `image_sessions`

Expected output:

- Schema SQL.
- RLS recommendation.
- Adapter implementation notes.

### 6. QR Phone Upload

Research:

- QR generation package for React.
- Upload session expiration.
- Desktop polling vs Supabase Realtime.
- Upload validation and abuse limits.

Expected output:

- Simple QR upload flow.
- Package recommendation.
- Security checklist.

### 7. RAG And Embeddings

Research whether RAG is necessary.

Likely knowledge sources:

- SHORIR abstract.
- Rulebook.
- Food dataset.
- Exercise safety notes.
- Coach-review guidelines.

Expected output:

- Implement now, stub, or skip decision.
- If deferred, define future adapter boundary.

### 8. Hugging Face Models And Repos

Research:

- Pose models.
- Food classification models.
- Bangla-capable text models.
- Embedding models.

Expected output:

- Shortlist of useful future models.
- Clear “use now” vs “defer” decision.

### 9. Deployment And Tooling

Research:

- Railway backend deployment.
- Vercel/Netlify/Railway frontend deployment.
- CORS setup.
- Environment variables.
- Supabase project setup.
- CLI usage.
- ZIP packaging without secrets.

Expected output:

- Deployment checklist.
- Commands.
- Risk notes.

## Data Collection Instruments

For technical research:

- Source comparison table.
- Model/API evaluation checklist.
- Integration notes.
- Build log entries.

For product/user validation:

- Manual QA checklist.
- Demo script review.
- Judge-readiness checklist.
- Safety and privacy copy review.

## Validation And Reliability

The research should be validated through implementation checks:

- `pnpm build` passes.
- API health endpoint works.
- Frontend calls backend through `ApiClient`.
- Gemini key is backend-only.
- Camera frames remain browser-side.
- QR upload flow can be tested on phone.
- Meal review returns uncertainty-aware output.
- Presentation/report content matches implemented behavior.

## Ethical Considerations

SHORIR AI must avoid overclaiming.

Required safeguards:

- No diagnosis or treatment claims.
- Pain flags trigger stop/consult messaging.
- Pose coaching is guidance, not medical assessment.
- Raw camera frames are not uploaded.
- Meal-image review returns estimates/ranges/questions, not certainty.
- Gemini prompts must explicitly require uncertainty and safety disclaimers.
- Backend secrets must never appear in frontend variables or source screenshots.
- Users should know whether images are stored, processed temporarily, or converted into derived signals only.

## Timeline And Milestones

### Phase 1 - Scaffold

- Modular monorepo.
- Contracts.
- Placeholder frontend/backend.
- Docs and delegated folders.

Status: complete.

### Phase 2 - Research Lock

- Pose model decision.
- Gemini model/schema decision.
- Supabase schema decision.
- QR package decision.
- Meal dataset plan.

### Phase 3 - Core Implementation

- Supabase adapter.
- Gemini adapter.
- Onboarding save/load.
- Workout session persistence.
- Coach review endpoint.

### Phase 4 - AI Product Demo

- Pose estimator adapter.
- Squat state machine.
- Session summary.
- QR/upload meal review.

### Phase 5 - Submission Packaging

- Live deploy.
- Presentation.
- Technical report.
- Source ZIP.
- Final QA.

## Deliverables

Research deliverables:

- `docs/RESEARCH_PLAN.md`
- `docs/RESEARCH_FINDINGS.md`
- `docs/DECISIONS.md`
- `docs/API_CONTRACT.md`
- `docs/RULEBOOK_NOTES.md`
- `docs/FINAL_REPORT_NOTES.md`
- `docs/PRESENTATION_NOTES.md`

Competition deliverables:

- Live website URL.
- Project presentation.
- Technical report.
- Source code ZIP.

## Budget And Resource Scenarios

| Scenario | Tools | Tradeoff |
| --- | --- | --- |
| Low | Browser pose model, Gemini free/low tier, Supabase free tier, Railway/free static hosting | Fastest and likely enough for final-round demo |
| Medium | Paid Gemini quota, Supabase hosted project, Railway backend, Vercel frontend | More stable for demo and judges |
| High | Custom model training, paid image storage, advanced analytics | Out of scope before June 26 |

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Pose model performs poorly on device | Medium | High | Use confidence abstain state and fallback demo video/screens |
| Gemini returns unsafe/overconfident nutrition advice | Medium | High | Use structured schema and strict safety prompt |
| Supabase setup delays implementation | Medium | Medium | Keep memory adapter working as local fallback |
| QR phone upload has network issues | Medium | Medium | Keep desktop upload as fallback |
| Deployment CORS/env issues | Medium | High | Add health endpoint and `.env.example`; test early |
| Scope creep | High | High | Keep MVP limited to squat coach, session review, and cautious meal review |

## Prioritized Sources To Consult

- Gemini API official docs.
- MediaPipe Pose Landmarker Web docs.
- TensorFlow.js MoveNet docs.
- Supabase Auth, RLS, and Postgres docs.
- Railway deployment docs.
- Vite env variable docs.
- Bangladeshi/South Asian food composition references.
- Maintained GitHub examples for React pose detection and QR upload.

## Next Steps Checklist

- [ ] Research and choose pose model.
- [ ] Define squat state machine thresholds.
- [ ] Research Gemini structured output and image input.
- [ ] Draft Gemini coach-review and meal-review schemas.
- [ ] Design Supabase schema SQL.
- [ ] Choose QR package and upload flow.
- [ ] Build starter Bangladeshi food dataset.
- [ ] Decide whether RAG is skipped or stubbed.
- [ ] Update `docs/DECISIONS.md` with final technical choices.
- [ ] Convert findings into `docs/FINAL_REPORT_NOTES.md`.

