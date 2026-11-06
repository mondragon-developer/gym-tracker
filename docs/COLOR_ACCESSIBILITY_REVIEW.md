# Color and accessibility review

## Implementation and verification, November 6, 2026

Implemented the cyan and navy palette in both themes, including predictable header surfaces, shared action colors, two-color keyboard focus indicators, a skip link, labeled authentication fields and announced form errors. Removed the fixed portrait orientation from the install manifest.

Workout fields now wrap to preserve usable input widths. The original three-column layout produced a 13px weight input at a 320px viewport; the final layout fixes that finding. Summary tables retain horizontal scrolling within their own named, keyboard-focusable regions. Mobile save controls flow with the page. Exercises have Move up and Move down controls with localized position announcements.

The rest alert no longer flashes. It shares focus containment, background inertness, scroll locking and focus restoration with regular dialogs, including when it opens above another dialog. Stepper controls no longer clip their keyboard focus indicators.

Validation on the final source:

- Vitest: 68 files and 499 tests passed. Added behavioral coverage for tap reordering, read-only weeks, preserved inert/scroll state, and the timer alert above an existing modal, including Tab, Shift+Tab, Escape and restored focus.
- ESLint, `git diff --check`, production build and configured light/dark contrast pairs passed. The existing build chunk-size warning remains.
- Chrome rendered-component audit: 76 cases completed with zero reported axe violations and no document-width overflow. The matrix covers 13 screens in both languages and themes at 320px, plus dashboard, import, focus workout and coach bar at 375px, 768px and 1280px in both themes. Screens include authentication, recovery, exercise picker, summary, templates and rest alert. The fixture uses synthetic workout data and does not save production workouts.
- Visual inspection of the light workout layout confirmed the navy header, cyan actions and neutral page background.

The audit uses the local `temp/a11y-runner.html` and `temp/a11y-fixture.jsx` with axe-core loaded as a classic script. Run Vite and open `/temp/a11y-runner.html` to repeat it in this workspace. These temporary fixtures are not part of the production build. Some contrast checks remain marked incomplete by axe, particularly gradient-backed text; the explicit token checks cover the header endpoints and named foreground/background combinations.

This is a targeted accessibility improvement, not a full WCAG conformance certification. Screen-reader testing, all trainer/admin states, third-party chat, every error path and every text-resize configuration are not covered by this matrix. The historical review below describes the original state before implementation.

Reviewed November 5, 2026, against commit `1f105a067ee590840cbc9f03ca50b69c9deb319a`. This is an initial source and live UI review, not a complete WCAG 2.2 AA conformance assessment. No application colors or production settings were changed during this review.

The proposed direction is electric cyan with deep navy. Use bright cyan for prominent actions and decorative accents, dark cyan for links on light surfaces, and white or pale neutral workout cards. Keep success, warning, and error colors distinct, with text and icons identifying their meaning. Replace the pale lime page background with a neutral tint so the cyan actions draw attention. Preserve light, dark, and system modes.

| Proposed use | Colors | Calculated text contrast |
| --- | --- | --- |
| Prominent action, matching the Import button | `#083344` text on `#22d3ee` | 7.41:1 |
| Header | White text on `#0f172a` | 17.85:1 |
| Light-surface links | Existing dark cyan `#0e7490` on white | 5.36:1 |

Bright cyan with white text is only 1.81:1 and must not be used for ordinary button labels. These numbers cover the listed solid text/background pairs, not every interaction or adjacent boundary.

`npm run check:contrast` passed all currently configured light and dark token pairs. The script does not cover every rendered combination, gradient, transparency, focus context, or the hardcoded Import highlight. Its passing result does not establish application-wide compliance.

| Finding | Evidence and scope | Proposed work |
| --- | --- | --- |
| Focus contrast on colored surfaces | In light mode, `--focus` on `--day-open-bg` is 1.02:1. In dark mode, `--focus` on `--toast-bg` is 1.65:1. Global focus rules use this one token across those surfaces. | Add contextual or two-color indicators and check actual rendered focus states, including Import, Copy, Close, day headers, and header controls. |
| Header colors not fully covered | `tokens.css` uses a gradient; `headerControlStyle.js` adds white translucent backgrounds at rest and on hover. Neither composited state is in the contrast script. | Use a sufficiently dark header with predictable control surfaces; include hover and text transparency in verification. This review does not assert that every current header label fails. |
| Reflow issue observed | The live signed-in workout page showed horizontal scrolling at 400% and 500% Chrome zoom in the existing window. Exact CSS viewport dimensions were not instrumented. Source includes a 320px root minimum plus body padding and fixed negative footer margins. | Diagnose the overflowing element and verify at exactly 320 CSS pixels, including dialogs and expanded exercises. Do not hide overflow to conceal inaccessible content. |
| Dragging alternative missing | `DayAccordion.jsx` provides pointer, touch, and keyboard drag sensors. `ExerciseItem.jsx` exposes a drag handle, without a click/tap reorder alternative. | Add Move up / Move down or a position selector. Keyboard dragging alone does not meet SC 2.5.7. |
| Rest alert focus containment needs work | `RestTimer.jsx` moves focus to its dismiss button and restores it, but its custom overlay does not trap Tab or make the background inert. | Prevent focus from moving behind the full-screen alert; verify Tab, Shift+Tab, Escape, and focus restoration. |
| Contrast regression coverage incomplete | Existing checks omit the combinations above. | Extend checks to the actual new palette, contextual focus, header states, and action colors. Keep the checker described as contrast testing, not WCAG certification. |

Useful existing foundations include named controls in the live accessibility tree, native buttons for day expansion, `aria-pressed` states, shared modal keyboard containment and focus restoration, bilingual document language updates, keyboard drag support, a reduced-motion override for the rest alert, and 44px targets on the coach plan bar. These were observed in source or the accessibility tree, not all tested with a screen reader.

Before claiming full WCAG 2.2 AA conformance, review all applicable A and AA criteria across complete processes: authentication and recovery, legal consent, exercise planning and tracking, timers, imports, dialogs, trainer/admin flows, charts, exercise media, and the embedded Chatbase chat. Include keyboard-only use, screen-reader reading order and announcements, field errors, focus visibility and obstruction, target size or spacing exceptions, text spacing, 200% text resize, exact 320px reflow, color-independent status, reduced motion, and both themes and languages. Third-party chat requires its own testing; app CSS cannot guarantee accessibility inside its iframe.

The live review did not alter workouts. Chrome zoom was restored to 100%. No screen-reader session, automated rendered-page accessibility scan, complete workflow audit, or exact viewport measurement was performed in this initial review.

References: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [dragging alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), and [focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).
