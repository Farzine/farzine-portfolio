# Design specification

Implement the [legacy baseline](design-preservation.md), not a new template. Use CSS custom properties and the existing Bootstrap grid geometry; no extra utility CSS framework. Reuse source rule shapes in focused components, avoiding hard-coded palette values throughout JSX.

| Token | Dark (initial/default) | Light (implemented; AA pairs verified) |
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

Use semantic header/nav/main/section landmarks; one identity h1, section h2, subsection/card h3 where possible without changing styles. Real links/buttons, visible 2px focus outlines, 44px touch targets where needed, skip link, Escape and focus return for overlays. Never place meaningful text inside canvas. Plain text/structured paragraphs instead of CMS HTML. Informative images need meaningful alt text and reserved dimensions; exact caption-duplicate certificate images use empty alt to avoid repeating their link name. Mobile menu must expose expanded state and keyboard controls.

Motion: existing 150–300ms opacity/transform feedback; no blocking intro. Respect reduced motion for typing/transitions/WebGL. Canvas must be lazy, capped DPR ≤1.5, modest geometry/draw calls, idle until interaction, pause offscreen/hidden, dispose resources. Keep static source composition with JS disabled. Theme preference explicitly saved; dark first visit irrespective of OS; pre-paint application without hydration mismatch. Unit tests measure both palettes for text/headings/accent/muted/errors on background/surface/hover and inverse accent buttons (all ≥4.5:1). Original white skill panels remain navy on white. Decorative source icon colors are retained; labels convey their meaning.

Admin uses the same fonts/colors and accessible controls, with denser simple lists/forms. Explicit labels, inline errors associated with fields, status announcements, confirmation before deletion, disabled saving state and unsaved-change protection. No decorative 3D in admin.


Phase 6 uses a 44px fixed lower-right circular theme button (15px inset, safe-area aware) so it takes no space from the original identity/navigation. Its stable accessible name is “Light theme” with aria-pressed; sun/moon and title communicate the available action. The control is hidden until hydrated, so no-JS gets the complete dark page without a dead button. Labels are editable in public display labels. Explicit localStorage preference is applied by a fixed head script before paint; system preference never changes the dark first visit. Storage denial still permits switching for the current page. A narrow html attribute hydration exception covers this intentional pre-paint update; no content-level mismatch suppression.

Original role typing is restored with accessible static role text, a visible first-role fallback and timer-based cycling only while visible, active and motion-enabled. Section entry uses a short opacity transition. Project hover/focus can enhance the **existing** two white corner brackets with a slight Three.js depth response. The card, image, text, overlay, link and dialog geometry remain unchanged. Only one scene exists, loaded after 180ms deliberate interaction on a fine-pointer ≥992px device with sufficient reported memory/cores and no data-saving request. Touch/tablet/reduced-motion users keep CSS. DPR ≤1.5, one draw call/eight triangles, no textures/lights/shadows/postprocessing; RAF stops when settled. Exit/blur/offscreen/hidden/reduced-motion/resize-to-mobile/unmount releases observers/listeners/buffers/material/program/renderer/context. Slow sustained frame intervals, WebGL/context failure and chunk errors retain CSS.

Phase8 scans cover every public section in both themes at three viewports plus actual owner forms/validation. Static/touch certificate captions use theme text on theme surface; photographic overlays retain white on dark. app/icons.css retains the25 original glyphs/fonts in one Next stylesheet; original vendor files remain intact. See [final QA](qa/phase-8.md) for automated limits and remaining manual device/screen-reader checks.
