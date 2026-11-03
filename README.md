# help-center-wysiwyg

Wysiwyg editor used in Zendesk Help Center

> [!IMPORTANT]
> This custom CKEditor build cannot be used outside of Zendesk Help Center which is properly licensed to use CKEditor 5.
> For more information see [LICENSE.md](./LICENSE.md).

## Install

```
$ yarn add @zendesk/help-center-wysiwyg
```

## API

#### Editor.create(config)

Use CKEditor's configuration-only creation API. `getEditorConfig(productOptions)`
is a product-preset builder, not a second initialization API: it selects the plugins
and settings for comments, community posts, or support requests.

```js
import Editor, { getEditorConfig } from "@zendesk/help-center-wysiwyg";

const editor = await Editor.create({
  ...getEditorConfig({
    editorType: "supportRequests", // "comments" | "communityPosts" | "supportRequests"
    hasAtMentions: true,
    userRole: "admin",
    brandId: 123,
    baseLocale: "en-us",
  }),
  attachTo: target,
});
```

#### React

React uses the same editor class and product presets through `@ckeditor/ckeditor5-react`:

```js
import { render } from "react-dom";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import Editor, { getEditorConfig } from "@zendesk/help-center-wysiwyg";

render(
  <CKEditor
    editor={Editor}
    config={getEditorConfig({
      editorType: "comments",
      hasAtMentions: true,
      userRole: "admin",
      brandId: 123,
      baseLocale: "en-us",
    })}
  />,
  target,
);
```

_Not available when the `editorType` is `"supportRequests"`._

#### editor.plugins.get("Notification")

Handling notifications can be done by directly accessing the `Notification` plugin:

```js
const notifications = editor.plugins.get("Notification");

notifications.on("show", (event, data) => {
  const message =
    data.message instanceof Error ? data.message.message : data.message;
  const { type, title } = data;
  // Log to the console or use your own notification dispatcher:
  console.log({ type, title, message });
});
```

## v49 migration and theming

CKEditor is pinned to **49.0.1** with Flora icons **9.0.0-next.0**. React consumers
must upgrade `@ckeditor/ckeditor5-react` to **12.0.0** (adapter 11 is not compatible
with this engine). The default class export and `getEditorConfig()` are preserved.
**The `createEditor()` helper is removed.** Replace
`createEditor(target, productOptions)` with
`Editor.create({ ...getEditorConfig(productOptions), attachTo: target })`.
Element-first `Editor.create(target, config)` is no longer part of this package's API.

The shared `Editor.create(config)` path automatically loads translations and installs
all required CSS, including when invoked by the React adapter. Consumers should not
copy style tags or import CKEditor CSS again.

### Host-owned appearance

```html
<html data-hc-color-scheme="dark" style="--hc-primary-color: #7950b8"></html>
```

- `data-hc-color-scheme="light|dark"` on `html` is followed live. Missing/unknown
  values mean light. The host owns OS preference detection and persistence.
- `--hc-primary-color` is read from `html` at first editor initialization. Branding
  is static for the page; reload to change it. The editor derives a 12-shade palette
  without writing to the host's `--hc-*` variables. One theme is shared across roots.
- Supported primary inputs: hex, named colors, legacy comma-separated `rgb()` /
  `rgba()` and `hsl()` / `hsla()` as parsed by color2k 2.0.3. Alpha must equal 1.
  Empty, invalid, translucent and unsupported syntax (including `oklch()`,
  `currentColor` and unresolved `var()`) falls back to Flora blue; it never blocks
  initialization. CSS may resolve a `var()` before the computed value is read.
- The small internal Flora token subset references Garden
  `@zendeskgarden/react-components@10.0.0-next.4`. The palette generator is copied
  from Lisbon at `02d04e3bbd0362890225c4c278831a2356600ad0`,
  `src/color-scheme/generateColorScale.ts`, with validation kept separate. Parity
  tests use Garden only as a development dependency; React/Garden/styled-components
  are not shipped in the editor bundle.
- Essential control borders are strengthened to Flora neutral-600; primary shades
  are strengthened when needed for text contrast. Solid scheme-aware focus rings
  supplement the refreshed theme. These are accessibility adjustments, not a
  promise that arbitrary raw `--ck-*` overrides are supported branding APIs.
- Toolbar, inputs, balloons and mention suggestions use Flora. Editable typography
  remains 15px/24px with existing paragraph/list/code conventions; content colors
  follow the scheme. Presentation is not added to saved HTML.

### Configuration and shadow roots

Pass engine configuration directly to CKEditor, alongside the product preset:

```js
const editor = await Editor.create({
  ...getEditorConfig(productOptions),
  attachTo: target,
  ui: { overlayContainer: callerOwnedOverlayRoot },
  root: { label: "Message" },
});
```

There is no package-level configuration-merging API. The object spread above is
ordinary JavaScript: supplied properties replace preset properties. CKEditor applies
its own `Editor.defaultConfig` defaults, so an overlay-only `ui` configuration still
receives the default navbar viewport offset. Product options such as `editorType`
belong to `getEditorConfig()`, not the engine configuration.

When `root.label` is omitted, the shared creation path infers it from a source
textarea's `aria-labelledby`, resolving IDs within the source tree (including closed
shadow roots) and removing required-field asterisks. An explicit label, including an
empty string, wins. If using CKEditor's `roots` configuration instead of the
single-root `root` shorthand, supply the label there explicitly.

Mount the target in its final tree before creation. A detached/config-only editor
without a target receives document styles; moving it to a new shadow tree afterward
is not supported. Styles are installed once per Document/ShadowRoot, in deterministic
order before editor measurement. They remain installed after destruction for reuse;
the last editor releases the scheme observer. Unrelated styles/adopted sheets are
untouched. Caller-supplied overlay trees automatically receive the same CSS/palette.

Closed-root mounting is smoke-tested, **not an upstream support guarantee** (v49
only publicly supports open roots). The package never opens/replaces the caller's
root. Floating UI uses v49's default placement unless `ui.overlayContainer` is
supplied. The `ui-overlay-container-not-configured` warning in a shadow root is
expected with defaults; a clipping ancestor may still require the caller's escape
hatch. No package-managed external overlay is created. Chromium/Safari have upstream
shadow-selection direction limitations; do not equate a smoke test with full IME,
clipboard or accessibility certification. See [validation notes](docs/ckeditor-v49-validation.md).

Mentions retain the server's `<x-zendesk-user data-user-name="…">ID</x-zendesk-user>`
format. Internal data downcasts include UIDs, clipboard downcasts omit them, and the
server processor strips them. Reload intentionally generates new UIDs: server IDs
and names, not editor-instance UIDs, are the persisted contract. Adjacent duplicate
mentions are kept distinct.

### Runtime errors: no implicit recovery

v49 removes Watchdog. The vanilla helper never supplied it; **React consumers lose
previous implicit automatic restart and content recovery**, even if they never
specified `onError`. This migration intentionally adds no recovery UI or retries.
The host owns reporting, drafts, notifications and recovery policy. Adapter 12 logs
to the console by default; a failed editor may remain visible/editable in an
inconsistent state.

Vanilla observation uses the bundled class (no second CKEditor import needed):

```js
const unsubscribe = Editor.onEditorError(({ error, source }) => {
  if (source !== editor) return; // Global observer; filter to this instance.
  reportError(error);
});
// During host cleanup:
unsubscribe();
await editor.destroy();
```

React uses `<CKEditor onError={(error, details) => reportError(error)} … />`.
Observation covers attributable uncaught `CKEditorError`s, not every application,
upload or validation failure. Handle creation/destruction promise rejections
separately with `try`/`catch`. Nothing is automatically recreated or restored.

## Development

There is an example page in [public/index.html] and it can be ran with:

```
yarn start
```

You should then be able to access it in your browser:

```
open http://localhost:8080/
```

### Focused regression tests

```sh
yarn build
yarn playwright install chromium
yarn test
```

Vitest runs pure palette tests and a Chromium Browser Mode suite against the actual
webpack UMD artifact. CI installs the headless browser and runs the suite explicitly.
For visual review, serve the repository root and open
`tests/fixtures/editor.html`; `public/index.html` also uses the configuration-only API.
The fixture supports `?shadow`, `?scheme=dark`, `?primary=%23ff00ff`,
`?type=comments`, `?type=supportRequests&role=anonymous` and `?locale=ar`.
Its mocked/demo upload endpoints are not a production consumer integration.

## Making changes

When you're done with your changes, we use [changesets](https://github.com/changesets/changesets) to manage release notes. Please run `changeset` to autogenerate notes to be appended to your pull request.
