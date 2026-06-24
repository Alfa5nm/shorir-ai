# Antigravity Prompt

You are implementing one isolated frontend module in the SHORIR AI TypeScript monorepo.

Before writing code:

1. Read `README.md`, `CONTEXT.md`, `TASK.md`, and `ACCEPTANCE.md` in this folder.
2. Inspect only:
   - `apps/web/src/features/exercise-library/`
   - `apps/web/src/components/ui/StatusPill.tsx`
   - nearby feature components for React conventions.
3. Do not edit any file outside the allowed ownership paths.

Implementation rules:

- Build one small component or data section at a time.
- Keep the existing `ExerciseGuide` interface unchanged.
- Use only installed React, TypeScript, and `lucide-react`.
- Do not invent APIs, dependencies, global CSS, or backend behavior.
- Prefer inline module styles through a local CSS file inside the allowed feature folder.
- Use cautious fitness wording and no medical guarantees.
- Run `pnpm --filter @shorir/web typecheck` after each meaningful section.
- Run `pnpm --filter @shorir/web build` before finishing.
- If blocked by a required change outside the allowed paths, document it in `BLOCKERS.md` and stop.

Final response must include:

- changed files;
- implemented behavior;
- typecheck/build results;
- desktop and mobile screenshots;
- completed acceptance checklist.
