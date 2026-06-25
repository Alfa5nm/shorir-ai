# SHORIR AI Design System

## Direction

Competition Showcase: bright, polished, white/blue, energetic, and still practical for repeated use. The app should feel like a working product being presented confidently, not a decorative landing page.

## Visual Tokens

- Canvas: ice white `#f4f8ff`
- Surface: white `#ffffff`
- Soft surface: blue-tinted `#eaf3ff`
- Ink: deep navy `#08162f`
- Muted text: slate blue `#58708f`
- Primary: electric blue `#1467d8`
- Primary strong: royal blue `#084aa5`
- Accent: cyan `#14b8ff`
- Success: green `#16a34a`
- Warning: amber `#d97706`
- Danger: red `#dc2626`

## Layout

- Shell is compact and product-first.
- Use wide, calm pages with `min(1240px, calc(100% - 32px))`.
- Avoid nested cards. Use cards only for repeated items, tools, and framed evidence.
- Primary work areas should appear above supporting detail.
- Mobile uses a fixed bottom navigation row and compact header branding.

## Components

- Buttons use shadcn-style variants: default, secondary, outline, ghost, destructive.
- Cards use 8px radii, thin blue-gray borders, and restrained shadows.
- Badges are small, high-contrast status labels.
- Tabs hide secondary content and prevent stacked layouts.
- Inputs/selects/textarea use consistent white surfaces, blue focus rings, and stable heights.

## Motion

- Use route/section entrance and reveal animation for non-critical content.
- Do not animate live camera controls in ways that delay use.
- Respect `prefers-reduced-motion`.

## Accessibility

- Maintain visible focus states.
- Preserve semantic headings and labels.
- Avoid text over images unless contrast is guaranteed.
- Do not rely on color alone for state.
- Ensure mobile controls are touchable and text does not overflow.

## Impeccable Method

Use Impeccable as methodology, not as a committed CLI dependency:

1. Shape: clarify the route goal.
2. Craft: implement the route pattern.
3. Critique: check layout, typography, focus, and overflow.
4. Polish: reduce visual noise and tighten interaction states.
