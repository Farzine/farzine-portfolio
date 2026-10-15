# Design specification

Implement the [legacy baseline](design-preservation.md), not a new template. Use CSS custom properties and the existing Bootstrap grid geometry; no extra utility CSS framework. Reuse source rule shapes in focused components, avoiding hard-coded palette values throughout JSX.

| Token | Dark (initial/default) | Light (phase 6 candidate, contrast verify) |
| --- | --- | --- |
| background | #010e1b | #f3f7fb |
| surface | #09203a | #e1edf7 |
| surface-hover | #042e5f | #d0e2f2 |
| text | #ffffff | #11263b |
| heading / rule | #dee2e6 | #1a3046 |
| accent | #21e5f3 | #006a76 |
| muted | #a8a9b4 | #4d6073 |
| skill panel | #ffffff | #ffffff |

Body Open Sans 400/600/700, headings Raleway 400/600/700, identity/nav Poppins 400/500/700. Self-host Latin font assets, with system sans-serif fallback. Base 16px/1.5, unchanged heading scales. Keep 30px container/grid padding/gutters; 20/24/30/40px component rhythm. Breakpoints 576/768/992/1200px. Keep square project/service panels, round social icons, 4px filters, 8px skill panels.

Use semantic header/nav/main/section landmarks; one identity h1, section h2, subsection/card h3 where possible without changing styles. Real links/buttons, visible 2px focus outlines, 44px touch targets where needed, skip link, Escape and focus return for overlays. Never place meaningful text inside canvas. Plain text/structured paragraphs instead of CMS HTML. All images need meaningful alt text and reserved dimensions. Mobile menu must expose expanded state and keyboard controls.

Motion: existing 150–300ms opacity/transform feedback; no blocking intro. Respect reduced motion for typing/transitions/WebGL. Canvas must be lazy, capped DPR ≤1.5, modest geometry/draw calls, idle until interaction, pause offscreen/hidden, dispose resources. Keep static source composition with JS disabled. Theme preference explicitly saved; dark first visit irrespective of OS; pre-paint application without hydration mismatch. Measure candidate light contrast before signoff.

Admin uses the same fonts/colors and accessible controls, with denser simple lists/forms. Explicit labels, inline errors associated with fields, status announcements, confirmation before deletion, disabled saving state and unsaved-change protection. No decorative 3D in admin.
