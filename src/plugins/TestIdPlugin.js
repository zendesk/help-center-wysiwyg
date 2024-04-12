/*
 * This plugin adds a data-test-id attribute to the editor element.
 */

export default function TestIdPlugin(editor) {
  editor.on("ready", () => {
    editor.ui.view.element.setAttribute("data-test-id", "zd-wysiwyg-editor");
  });
}
