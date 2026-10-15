# Design system: Profile explorer

A quiet editorial dossier for software engineering and machine learning work. Familiar navigation, ordered section markers, a portrait/orbit motif and inspectable project case files establish the explorer concept. Never display invented availability, visitor counts, rankings or metrics.

## Tokens

- Background `#101715`; surface `#17221e`; raised surface `#202e28`; border `#37473e`.
- Text `#f1f0e8`; muted text `#b6c4b8`; accent `#b9dfad`; accent text `#101715`.
- Display: locally hosted Source Serif 4; body: locally hosted DM Sans; small metadata: native monospace. Serif gives the dossier a personal editorial tone. No remote font request on initial page.
- Type: body 16–18px, line height 1.65; headline fluid 44–88px; section heading 30–48px; metadata 12–14px. Body lines max 65 characters.
- Spacing scale 4/8/12/16/24/32/48/64/96px. Content width 1200px, side gutters 24px mobile/48px desktop.
- Radii 4px controls, 12px media; fine one-pixel borders; no indiscriminate card grid or glow. Editorial lists for timeline and small collections.

## Components and layout

Header identity on left, compact familiar navigation on right. Mobile navigation wraps into a usable row; avoid hover-only menus. Hero is asymmetric copy/portrait layout on desktop and stacked copy then portrait on mobile. Section labels carry real order markers. Project grid has reserved image aspect ratio and explicit text links. Forms use visible labels, help text, associated errors and live status. Admin prioritizes efficient editing and shares tokens.

## Breakpoints and motion

Mobile below 640px, tablet 640–959px, desktop at 960px. Test 375/768/1440px plus 320px overflow. CSS transform/opacity transitions 120–220ms. No forced intro, scroll lock, autoplay video, looping typing or blanket reveal effects. Reduced motion eliminates movement. WebGL is decorative, lazy and optional with a CSS/static fallback, capped DPR and cleanup.

## Accessibility

Semantic landmarks, one primary heading per page, ordered heading levels, skip link, 44px touch controls and strong focus-visible outlines. Muted text must remain legible. Links have visible text and descriptive names. No color-only states. Reserve image dimensions, supply meaningful alt text for content images, and hide decorative art from assistive technology. Error pages must remain actionable without animation or WebGL.

## Phase 6 enhancement scope

Refine visible spacing/media browsing, preserve the portrait and editorial hierarchy. The geometric orbit is an optional secondary artifact; content and navigation remain ordinary HTML. Load Three.js only when the visitor explicitly starts the desktop exploration enhancement. Keep the static CSS artifact on mobile, reduced motion, low-capability devices and WebGL failure. Cap DPR, use few wireframe primitives, pause while hidden/offscreen and dispose all GPU resources/listeners/frames. Owner can disable this enhancement through a structured display setting. Measure downloaded chunks and browser behavior before making performance claims.
