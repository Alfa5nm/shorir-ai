# Deployment

## Backend

Target: Railway

Required environment variables:

- `PORT`
- `CORS_ORIGIN`
- `DATABASE_ADAPTER`
- `AI_COACH_ADAPTER`
- `GEMINI_AUTH_MODE`
- `GEMINI_MODEL`
- `GEMINI_USE_ENTERPRISE`
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

Use `DATABASE_ADAPTER=memory` and `AI_COACH_ADAPTER=stub` for scaffold testing.

For Gemini API key mode:

- `AI_COACH_ADAPTER=gemini`
- `GEMINI_AUTH_MODE=api_key`
- `GEMINI_API_KEY=...`

For Google Cloud Application Default Credentials / Agent Platform mode:

- Run `gcloud auth application-default login` locally.
- `AI_COACH_ADAPTER=gemini`
- `GEMINI_AUTH_MODE=adc`
- `GEMINI_USE_ENTERPRISE=true`
- `GOOGLE_CLOUD_PROJECT=...`
- `GOOGLE_CLOUD_LOCATION=global`

Do not put Gemini credentials in frontend env vars.

## Supabase CLI

The Supabase CLI is installed as a workspace dev dependency.

Useful commands:

```bash
pnpm supabase:version
pnpm supabase:init
pnpm supabase:start
pnpm supabase:status
pnpm supabase:lint
```

Local Supabase requires Docker Desktop. This project uses non-default local ports to avoid conflicting with other Supabase projects:

- API: `http://127.0.0.1:55421`
- Database: `postgresql://postgres:postgres@127.0.0.1:55422/postgres`
- Studio: `http://127.0.0.1:55423`
- Mailpit: `http://127.0.0.1:55424`

For local Supabase-backed API testing, use:

```bash
DATABASE_ADAPTER=supabase
SUPABASE_URL=http://127.0.0.1:55421
SUPABASE_SERVICE_ROLE_KEY=<from pnpm supabase:status>
```

If Docker is unavailable, apply the SQL files in `supabase/migrations/` in the hosted Supabase SQL editor or link/push from a machine with Docker/Supabase access.

## Frontend

Target: Vercel, Netlify, or Railway static hosting.

Required environment variable:

- `VITE_API_BASE_URL`

Phone camera WebRTC variables:

- `VITE_WEBRTC_TURN_URL`
- `VITE_WEBRTC_TURN_USERNAME`
- `VITE_WEBRTC_TURN_CREDENTIAL`

The browser uses a public STUN server by default. Configure TURN for production so phone video still connects
through restrictive mobile, corporate, or carrier-grade NAT networks. Prefer short-lived TURN credentials issued
by your TURN provider rather than permanent credentials in a frontend build.

Phone camera video is sent directly over encrypted WebRTC. The API stores only short-lived offer, answer, and ICE
signaling metadata. The current in-memory signaling store requires one API instance; use Redis or another shared
TTL store before horizontally scaling the API.

Do not expose Gemini or Supabase secret keys through `VITE_` variables.
