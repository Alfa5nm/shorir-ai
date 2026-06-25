# Contributing

## Setup

```bash
pnpm install
pnpm -r typecheck
pnpm -r build
```

Run the API and web app in separate terminals:

```bash
pnpm api:dev
pnpm web:dev
```

## Branches

- `main` is integration-owned and must stay buildable.
- Use `contrib/<feature>` for beginner-safe feature work.
- Open a pull request; do not push feature work directly to `main`.

## Pull Requests

- Keep changes inside the assigned ownership boundary.
- Include a short summary, test results, and desktop/mobile screenshots for UI work.
- Do not add dependencies, APIs, medical claims, or new data contracts without approval.
- Run `pnpm -r typecheck`, `pnpm -r lint`, and `pnpm -r build`.

## Safety and Privacy

- Never commit credentials, `.env` files, user images, camera recordings, or health details.
- Fitness and nutrition guidance must be cautious and must not diagnose or guarantee outcomes.
- Camera frames must remain browser-side except for the explicitly documented temporary meal-image upload.
