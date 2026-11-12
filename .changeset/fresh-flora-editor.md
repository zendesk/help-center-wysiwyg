---
"@zendesk/help-center-wysiwyg": major
---

Upgrade CKEditor from 47.7.6 to 49.1.0, including its updated appearance and Shadow DOM support.

### Breaking changes

- Pass both `locale` and `baseLocale` as non-empty strings to `createEditor()` or `getEditorConfig()`. Use the same value for both if there is no separate preferred locale. `baseLocale` controls the editor language and text direction.
- If you call `Editor.create(target, config)` directly, switch to `Editor.create({ ...getEditorConfig(options), attachTo: target })`. The `createEditor(target, options)` helper still takes two arguments.
- React consumers must upgrade `@ckeditor/ckeditor5-react` to 12.0.0. CKEditor 49 no longer includes Watchdog, so the React adapter no longer automatically restarts the editor or restores its content after an error. Applications must handle errors and recovery themselves. The vanilla helper did not previously provide automatic recovery.

### Other changes

- The editor uses Garden Flora styling and can follow the Help Center theme's appearance. Set `data-hc-color-scheme` to `light` or `dark` on the `html` element to choose the color scheme, and set the `--hc-primary-color` CSS property there to apply the brand color to editor accents. Scheme changes apply while the editor is open; the primary color is read at initialization and when the scheme changes. Without a scheme, the editor uses light; an unset or invalid primary color uses neutral accents.
- Editor styles are installed automatically in the document or shadow root, including a caller-provided overlay container. Source textarea labels are used when no explicit root label is provided.
- Translations now try `locale` first, so a regional locale in the Help Center URL (such as `en-dk`) can use its own translations when available. If they are not available, the editor falls back to `baseLocale`, then to English. Falling back does not change the editor language or text direction. See [Copenhagen theme PR #892](https://github.com/zendesk/copenhagen_theme/pull/892) for more context.
- Support-request forms now clean up inline image attachments within the owning form, including forms in shadow roots and forms with multiple editors.
