# help-center-wysiwyg

A rich text editor for Zendesk Help Center comments, community posts and support requests.

> [!IMPORTANT]
> This custom CKEditor build is licensed for use in Zendesk Help Center only. See [LICENSE.md](./LICENSE.md).

## Install

```sh
yarn add @zendesk/help-center-wysiwyg
```

## Create an editor

Use `createEditor` to attach an editor to an element:

```js
import { createEditor } from "@zendesk/help-center-wysiwyg";

const editor = await createEditor(target, {
  editorType: "comments", // "comments", "communityPosts", or "supportRequests"
  hasAtMentions: true,
  userRole: "admin",
  brandId: 123,
  locale: "en-gb",
  baseLocale: "en-us",
});

// When the editor is no longer needed:
await editor.destroy();
```

`locale` and `baseLocale` are required, non-empty strings. Use the same value for both if there is no separate preferred locale. `locale` selects the preferred translations; `baseLocale` sets the editor language and text direction. If translations for `locale` are unavailable, the editor tries `baseLocale`, then English. Individual missing translations also fall back to English.

Custom plugin translations are shared between editors on the page. Editors on the same page should use the same translation locale.

For support requests, the target must be a textarea associated with a form. React integration is not available for this editor type.

### React

Use `@ckeditor/ckeditor5-react` version 12.0.0 with the default editor export and `getEditorConfig`:

```jsx
import { CKEditor } from "@ckeditor/ckeditor5-react";
import Editor, { getEditorConfig } from "@zendesk/help-center-wysiwyg";

function CommentEditor({ saveDraft }) {
  return (
    <CKEditor
      editor={Editor}
      config={getEditorConfig({
        editorType: "comments",
        hasAtMentions: true,
        userRole: "admin",
        brandId: 123,
        locale: "en-gb",
        baseLocale: "en-us",
      })}
      data="<p>Initial content</p>"
      onChange={(event, editor) => saveDraft(editor.getData())}
    />
  );
}
```

### Direct configuration

For CKEditor options not exposed by `createEditor`, use `getEditorConfig` with `Editor.create`:

```js
import Editor, { getEditorConfig } from "@zendesk/help-center-wysiwyg";

const editor = await Editor.create({
  ...getEditorConfig(productOptions),
  attachTo: target,
  root: { label: "Message" },
  ui: { overlayContainer: overlayRoot },
});
```

Pass product options such as `editorType` and locales to `getEditorConfig`. Add CKEditor options to the resulting configuration. Properties supplied after the spread replace the corresponding properties from `getEditorConfig`.

When no `root.label` is supplied, the editor uses the text referenced by the source textarea's `aria-labelledby`, if available. An explicit label, including an empty string, takes precedence. If using CKEditor's `roots` configuration, set the label there.

## Appearance and Shadow DOM

The editor uses Garden Flora styling. A Help Center theme can set its appearance on the `html` element:

```html
<html data-hc-color-scheme="dark" style="--hc-primary-color: #7950b8">
```

- `data-hc-color-scheme` selects `light` or `dark`. The editor follows changes to this attribute while it is open. Missing or unrecognized values use light.
- `--hc-primary-color` sets the brand color used for accents such as links and focus indicators. The editor reads it when created and when the color scheme changes. An unset or invalid color uses neutral accents.

The host is responsible for choosing and saving the color scheme. Changing the primary color alone does not update an open editor.

You can mount the editor in the page or inside a shadow root. Put the target element in its final location before creating the editor: the package automatically installs the editor's styles where the target is located. Moving the editor to another shadow root afterward will not install styles there.

By default, menus and dialogs appear in the same document or shadow root as the editor. If they are clipped by a surrounding element, you can use CKEditor's `ui.overlayContainer` option to place them elsewhere. The package also installs editor styles in the supplied container.

See CKEditor's [Shadow DOM guide](https://ckeditor.com/docs/ckeditor5/latest/getting-started/setup/shadow-dom.html), including [where floating UI mounts](https://ckeditor.com/docs/ckeditor5/latest/getting-started/setup/shadow-dom.html#where-the-floating-user-interface-mounts), for more details.

## Notifications

Listen to the `Notification` plugin to handle editor notifications:

```js
const notifications = editor.plugins.get("Notification");

notifications.on("show", (event, data) => {
  const message = data.message instanceof Error ? data.message.message : data.message;
  console.log({ type: data.type, title: data.title, message });
});
```

## Development

Run the demo at `http://localhost:8080/`:

```sh
yarn start
```

Build and run the unit and Chromium browser tests:

```sh
yarn build
yarn playwright install chromium
yarn test
```

The browser tests use the built webpack bundle. For a visual test fixture, serve the repository root and open `tests/fixtures/editor.html`.

Use [changesets](https://github.com/changesets/changesets) to add release notes for package changes.
