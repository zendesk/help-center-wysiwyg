# CKEditor v49 migration validation

## Reproduction

```sh
yarn install --immutable
yarn build
yarn lint
yarn playwright install chromium
yarn test
python3 -m http.server 8097
# Open http://localhost:8097/tests/fixtures/editor.html
```

The fixture uses the **webpack production UMD artifact**, an explicit local GPL
license configuration, and demo endpoints. Production license selection remains
unchanged. Do not treat this fixture as validation of authenticated consumer APIs.

## Permanent coverage

The suite last passed with 43 tests (29 pure and 14 Chromium Browser Mode), before
switching toolbar buttons from borderless basic to bordered toggles and refining
the menu check icon. Further automated-test work is paused at the user's request;
the latest visual refinements have been checked in the rendered fixture instead.

- Direct Garden 10.0.0-next.4 semantic-token and branded-state mappings, including
  saturated, black/white, named, RGB and HSL inputs. CSS named colors are normalized
  to avoid interpreting them as Garden palette names. Invalid/unsupported and
  translucent public inputs fall back to Garden's default primary palette.
- Light/dark/default scheme resolution and contrast checks for UI text, primary
  actions, action text, essential boundaries and focus against the base surface.
- Real React adapter 12 initialization **before** any standalone initialization,
  including German localization and automatically installed CSS.
- Only the editor class and product-preset builder are exported; there is no
  separate creation helper. Explicit labels (including empty strings) win, and
  inferred labels preserve caller-owned root configuration and initial content.
- Configuration-only initialization, shadow-local root/toolbar labels,
  one stylesheet per root, shared styles surviving a peer's destruction, and live
  light/dark switching in a closed root.
- Independent caller-owned closed overlay styling and preservation of unrelated
  `ui` defaults.
- A fresh document with named-color branding, shared Garden tokens across regular
  DOM, a closed editor root and a separate closed overlay root; initial dark mode,
  live light/dark/unknown-scheme changes, static branding, stylesheet reuse,
  unchanged host attributes and preservation of the host's palette variables.
- Adjacent duplicate mentions, server save/reload HTML, and clipboard UID omission.
- Real rendered mention suggestions retain flex layout/padding after v49 adds
  `.ck-list-item-button`; link action text/background contrast in both schemes.
- Comments-editor destruction within a real form (regression for a function plugin
  returning the editor itself and causing recursive plugin destruction).
- Initialization failures remain rejected and a subsequent editor can initialize.

Expected browser-test output includes `ui-overlay-container-not-configured` for
closed-root default overlays. It is not suppressed or treated as a failure.

## Garden color implementation and bundle check

The copied palette generator and hardcoded semantic color table have been removed.
`src/theme/palette.js` uses Garden's public `DEFAULT_THEME` and `getColor` exports,
with a small input-validation wrapper and CKEditor state mapping. Runtime shade
search and foreground fallback have been removed; only Lisbon's explicit stronger
control-border mapping remains. The current scheme's declarations are computed
once per resolved scheme change, per document. A single observer updates each
active document/shadow root; no scheme attributes are mirrored onto hosts and no
global internal color bridge variables are introduced. Geometry is mapped from
Garden tokens, with targeted structural rules in CSS.

UI sources: Garden 10.0.0-next.4 `StyledButton`, `StyledIconButton`,
`StyledOption`, dropdown `utils.itemStyles`, and public `getFocusBoxShadow`.
The supplied Flora showcase was also inspected in the browser. Toolbar controls
use squared toggles with transparent idle/unpressed borders, visible hover borders
and persistent pressed borders, following the deliberate treatment from PR #44
(commits `c218595` and `9be1323`). Neutral 8% hover/16% pressed backgrounds and
Garden-derived border states are retained. Primary action buttons use Flora's
neutral fills. Focus uses a
surface-colored 1px spacer and solid 3px primary ring. Menu rows use the primary
8% tint, logical leading stripe/separator and Garden's fixed-size check SVG.
CKEditor heading previews and its checkmark/selection semantics are retained.
Earlier manual visual checks covered light regular DOM and dark Arabic RTL in a
closed root, before restoring transparent idle borders; this is not full
interaction/accessibility or consumer validation. Automated tests remain paused.

Before the subsequent UI refinements, an isolated production webpack comparison
against WIP commit `8d35be1` measured:

| Bundle                | Minified bytes | Gzip bytes |
| --------------------- | -------------: | ---------: |
| WIP, copied generator |      1,407,853 |    308,536 |
| Garden public helpers |      1,439,064 |    318,400 |
| Increase              |         31,211 |      9,864 |

The emitted chunk module graph retained Garden's theme, palette and `getColor`
modules and their utility dependencies, but no React, React DOM, styled-components
or Garden component modules. This relies on the pinned package's ESM exports,
`sideEffects: false`, and production webpack tree-shaking; recheck on upgrades.
The WIP comparison reconstructed the old theme files in a temporary directory;
it did not switch branches or alter the reference commit. Build output retains
webpack's editor-bundle size warnings.

The build, lint and full Chromium/pure suite were rerun for this implementation.
The broader manual checks below were performed earlier in the migration, not
repeated for this color-source change.

## Earlier migration browser checks

Using the same production artifact and fixture in headless **Chromium and Firefox**,
with both regular DOM and a directly mounted **closed** shadow root:

- Initialization and shadow-local labels.
- Mocked mentions feed, visible suggestion and keyboard acceptance, producing
  `<x-zendesk-user data-user-name="Alex Morgan">42</x-zendesk-user>` server HTML.
- Live dark-scheme switch without editor recreation.
- Keyboard selection-to-bold smoke and content round-trip. Firefox selected the
  intended four-character suffix; the Chromium run selected a shorter suffix in
  both regular and closed cases. This is not a complete selection-direction test
  or a claim that upstream shadow-selection limitations are fixed.
- A deliberately uncaught `editor.execute('controlled-nonexistent-command')`
  generated an attributable `CKEditorError`. `Editor.onEditorError` received the
  original editor as `source`; the instance remained the same, with no restart or
  restoration. The observer was unsubscribed. This checks reporting, not recovery
  from a genuinely corrupted model. React runtime routing was source-reviewed,
  not fault-injected in an authenticated Help Center session.
- Destruction completed.

Additional Chromium fixture checks:

- comments, communityPosts and supportRequests creation/content round-trip.
- Signed-in and anonymous support requests: textarea synchronization and one
  bubbling `input` event on a model write; anonymous image-upload button omitted.
- Comments within a form: hidden content type and destruction (fixed the reproduced
  recursion; did not rewrite pre-existing form listeners or mention shared state).
- Arabic RTL initialization and dark-mode screenshot. Flora SVGs are mapped
  directly, without package-specific RTL transforms or alternate glyphs.
  CKEditor's own undo/redo swapping remains unchanged.
- Default/light/dark screenshots, link forms, mention suggestions, saturated magenta
  branding, and dark RTL. Visual review removed an obsolete SVG fill override that
  made unmapped chevrons black in dark mode.

The old v47.7.6 bundle was saved **before dependency installation**. Its exact local
baseline renders but the LTS engine rejects the fixture's GPL key and becomes
read-only. Before/after comparison screenshots explicitly disclose this; they do
not claim baseline interactive behavior was validated. No license validation was
bypassed. Production consumer licensing remains unchanged.

Screenshots, comparison composites and raw local browser reports are intentionally
kept outside tracked changes, under `artifacts/ckeditor-v49/` (local Git exclude),
alongside the uncommitted handoff. None are package assets.

## Still required before release

These are **not** implied by the passing focused suite:

- Actual Lisbon, Copenhagen and Help Center consumer validation with a reproducible
  package artifact, including Help Center's application-side adapter upgrade to
  12.0.0. This PR documents that requirement; it does not change another repository.
- Authenticated uploads/attachments, CSRF/form submission and real backend error
  behavior. Fixture typing/round-trips do not exercise those endpoints.
- Safari: the local WebKit browser download did not complete. Firefox/Chromium
  smoke is not Safari coverage. Test supported shipping browser versions too.
- Full forward/backward pointer selection, native clipboard copy/cut/paste across
  roots, IME/composition, screen-reader behavior, focus restoration/outside clicks,
  and constrained/clipping/stacking/scrolling layouts with default overlays and the
  caller-supplied overlay escape hatch. No reproduced clipping failure led to a
  package-managed external overlay implementation.
- Comprehensive hover/active/selected/disabled/focus/error contrast against every
  adjacent surface, RTL interaction and final design review in actual consumers.
  Pure palette contrast and fixture screenshots are not an accessibility audit.

Closed roots remain a deliberately tested integration boundary, not an upstream
support promise. No production editor was added to Help Center Components. No
existing fallback PR, preserved worktree, release or remote branch was modified.
