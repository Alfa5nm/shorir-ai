# Contributor Boundaries

## Exercise Library

Allowed:

```text
apps/web/src/features/exercise-library/**
delegated/exercise-library/**
```

Integration-owned:

- routing and navigation;
- global styles and design tokens;
- shared contracts;
- API and database code;
- pose estimation and camera logic;
- package manifests and lockfiles;
- CI and deployment configuration.

If an allowed feature cannot be completed without an integration-owned change, document the blocker and request
the integration owner to make that change separately.
