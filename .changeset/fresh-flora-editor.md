---
"@zendesk/help-center-wysiwyg": major
---

Upgrade CKEditor to 49.0.1 with its refreshed theme, a small token mapping backed by Garden's public Flora theme/color helpers and Flora 9.0.0-next.0 icons. Follow the host's live `data-hc-color-scheme` and static `--hc-primary-color` branding, while preserving editable-content formatting and mention server HTML.

Install complete editor/plugin styles automatically per document or shadow root through a shared configuration-only `Editor.create(config)` path, including React initialization and styled caller-owned overlay containers. Migrate localization imports, root labels and mention clipboard UIDs.

**Breaking API:** Remove the `createEditor()` helper and element-first package API. Use `Editor.create({ ...getEditorConfig(productOptions), attachTo: target })` instead. `getEditorConfig()` remains a product-preset builder; engine settings are passed directly to CKEditor without custom override or merge rules. Source textarea labels are inferred in the shared path unless `root.label` is explicitly provided.

**Breaking:** React consumers must use `@ckeditor/ckeditor5-react` 12.0.0. CKEditor v49 removes Watchdog, including the React adapter's previously implicit automatic restart/content recovery. The vanilla helper did not previously supply Watchdog. Hosts own runtime error reporting and recovery; the package adds no automatic retries or restoration. See the README for the inherited `Editor.onEditorError` observer and React `onError` path.
