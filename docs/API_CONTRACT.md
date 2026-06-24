# API Contract

Base path: `/api`

## Health

- `GET /health`
- Returns service status and active database adapter.

## Auth

- `POST /auth/anonymous`
- Creates a lightweight anonymous profile/session placeholder.

## Profiles

- `POST /profiles`
- `GET /profiles/me?profileId=...`

## Sessions

- `POST /sessions`
- `GET /sessions?profileId=...`

## Events

- `POST /events`

## Coach Review

- `POST /coach-review`
- `GET /coach-review?profileId=...`

Generates and saves a structured coach review from a saved workout session.

## Image Sessions

- `POST /image-sessions`
- `GET /image-sessions/:id`
- `GET /image-sessions/:id/review`
- `POST /image-sessions/:id/upload`

Accepts one in-memory JPEG, PNG, or WebP upload under 6 MB and supports QR/phone handoff.

## Meal Review

- `POST /meal-review`

Generates and saves cautious meal review output.

## Phone Camera

- `POST /phone-camera-sessions`
- `GET /phone-camera-sessions/:id/signal`
- `POST /phone-camera-sessions/:id/offer`
- `POST /phone-camera-sessions/:id/answer`
- `POST /phone-camera-sessions/:id/ice-candidates`

The API carries temporary WebRTC signaling metadata only. Phone video travels directly between browsers.

Shared TypeScript shapes live in `packages/contracts`.

## Persistence

The backend database port currently has two adapters:

- `memory`: default local fallback, no credentials required.
- `supabase`: Postgres-backed adapter using `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`.

The initial schema is in `supabase/migrations/0001_initial_schema.sql`.
