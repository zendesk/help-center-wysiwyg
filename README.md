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

The easiest way to initialize the editor is using `createEditor`:

#### createEditor

```js
import { createEditor } from "@zendesk/help-center-wysiwyg";

const editor = await createEditor(target, {
  editorType: "supportRequests", // "comments" | "communityPosts" | "supportRequests"
  hasAtMentions: true,
  userRole: "admin",
  brandId: 123,
  baseLocale: "en-us",
});
```

#### getEditorConfig

If you're using react and don't need the editor instance, you can also render the editor using `@ckeditor/ckeditor5-react`:

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
  target
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

## Development

There is an example page in [public/index.html] and it can be ran with:

```
yarn start
```

You should then be able to access it in your browser:

```
open http://localhost:8080/
```

## Making changes

When you're done with your changes, we use [changesets](https://github.com/changesets/changesets) to manage release notes. Please run `changeset` to autogenerate notes to be appended to your pull request.
