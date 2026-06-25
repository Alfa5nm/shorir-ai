# SHORIR AI

SHORIR AI is a Bangla-first, privacy-aware fitness companion by Team El Bracino. The competition MVP combines
camera-calibrated squat coaching, an adaptive animated coach, cautious meal review, onboarding, and progress
summaries.

## Current Features

- Persistent anonymous browser profile and safety-aware onboarding.
- Browser-side MediaPipe squat and standard floor push-up analysis.
- Calibrated activity region, personal depth threshold, and relative camera-distance checks.
- Adaptive animated squat and push-up demonstrations.
- Direct encrypted WebRTC phone camera pairing through an automated HTTPS QR flow.
- Desktop and QR phone meal-image review.
- Saved session and coach-review progress dashboard.
- Independent exercise-library contribution module.

## Architecture

```text
apps/web            React/Vite frontend
apps/api            Express backend
packages/contracts  Shared TypeScript contracts
packages/content    Product and competition content
supabase             Database schema and local configuration
delegated            Bounded contributor task packages
docs                 Architecture, deployment, roadmap, and demo notes
```

Vendor integrations remain behind ports and adapters. Live pose video stays in the browser. Phone video travels
over WebRTC; the API exchanges temporary signaling metadata only.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## Local Setup

Requirements: Node.js 20+ and PNPM 9.

```bash
pnpm install
pnpm api:dev
pnpm web:dev
```

Open `http://localhost:5173`.

Verification:

```bash
pnpm -r typecheck
pnpm -r lint
pnpm -r build
```

Copy the example environment files only when configuring optional services:

```text
apps/api/.env.example
apps/web/.env.example
```

Never commit `.env` files or production credentials.

## Contribution

Read [CONTRIBUTING.md](CONTRIBUTING.md). Beginner exercise-library work is documented in
`delegated/exercise-library/` and is restricted to its assigned feature folder.

## Privacy and Safety

- Pose camera frames are not uploaded.
- Meal images are processed temporarily for the requested review.
- Guidance is educational and does not diagnose injuries or replace medical advice.
- Stop exercising if movement causes pain.

## Known Limitations

- Squat calibration still requires real-device tuning across more bodies, clothing, lighting, and camera angles.
- Monocular camera distance is a relative body-scale estimate, not physical depth sensing.
- WebRTC production reliability requires TURN and a shared signaling store before horizontal scaling.
- The memory database resets when the API restarts; Supabase is available for persistence.
- Meal recognition quality depends on the configured AI adapter; local stub output is intentionally limited.
- Push-up and lunge pose analysis are not part of this MVP.

## License

MIT
