# Exercise Library Contribution

Build a responsive bilingual exercise-library module for SHORIR AI.

## Allowed Files

```text
apps/web/src/features/exercise-library/**
delegated/exercise-library/**
```

Do not edit routing, global styles, API code, contracts, pose estimation, configuration, lockfiles, or dependencies.

## Start

Read these files in order:

1. `CONTEXT.md`
2. `TASK.md`
3. `ANTIGRAVITY_PROMPT.md`
4. `ACCEPTANCE.md`

Commands:

```bash
pnpm install
pnpm web:dev
pnpm --filter @shorir/web typecheck
pnpm --filter @shorir/web build
```

Open `http://localhost:5173/exercise-library`.
