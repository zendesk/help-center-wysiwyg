/*
  This plugin adds a class to the editable so that images
  with src-attributes that references external domains can be visually highlighted.
*/
export default function MarkExternalImagesPlugin(editor) {
  editor.ui.on("ready", () => {
    // Keep the class in the editing view: a DOM-only class is overwritten by
    // subsequent view rendering, and a source parent can be a ShadowRoot.
    editor.editing.view.change((writer) => {
      writer.addClass(
        "hc-ckeditor--mark-external-images",
        editor.editing.view.document.getRoot(),
      );
    });
  });
}
