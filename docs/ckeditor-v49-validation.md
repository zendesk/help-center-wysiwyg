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

33 tests: 22 pure tests and 11 Chromium Browser Mode tests.

- Shade-by-shade parity with Garden 10.0.0-next.4, including saturated, black/white,
  HSL and translucent algorithm inputs; separate invalid/translucent public-input
  fallback tests. The public contract rejects alpha below 1.
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
- Adjacent duplicate mentions, server save/reload HTML, and clipboard UID omission.
- Real rendered mention suggestions retain flex layout/padding after v49 adds
  `.ck-list-item-button`; link action text/background contrast in both schemes.
- Comments-editor destruction within a real form (regression for a function plugin
  returning the editor itself and causing recursive plugin destruction).
- Initialization failures remain rejected and a subsequent editor can initialize.

Expected browser-test output includes `ui-overlay-container-not-configured` for
closed-root default overlays. It is not suppressed or treated as a failure.

## Additional local browser checks performed

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
