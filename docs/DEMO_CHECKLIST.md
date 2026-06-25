# Demo Checklist

## Before the Demo

- [ ] API and web app start without errors.
- [ ] Phone and desktop are online.
- [ ] Camera permission is available.
- [ ] HTTPS phone tunnel or production URL works.
- [ ] No private credentials or personal test images are visible.

## Product Flow

- [ ] Complete onboarding and confirm profile saves.
- [ ] Open pose coach with local camera.
- [ ] Complete standing and squat-depth calibration.
- [ ] Leave the activity box once to demonstrate corrective feedback.
- [ ] Complete a counted squat and save the review.
- [ ] Open progress and show the saved session.
- [ ] Upload a meal image from desktop.
- [ ] Create a QR meal session and upload from phone.
- [ ] Explain cautious output and limitations.

## Camera QA

- [ ] Local and phone cameras.
- [ ] Side view and imperfect front view.
- [ ] Bright and dim lighting.
- [ ] Partial visibility and loose clothing.
- [ ] Closer/farther movement.

## Release

- [ ] `pnpm -r typecheck`
- [ ] `pnpm -r lint`
- [ ] `pnpm -r build`
- [ ] Known limitations reviewed.
