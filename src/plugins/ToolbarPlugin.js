/*
  This plugin adds a tabindex to the toolbar so that it can be focused via the keyboard.
  This is necessary for accessibility.

  Note that any toolbar can be focused via ALT+F10 by default:
  https://ckeditor.com/docs/ckeditor5/latest/features/keyboard-support.html#:~:text=Move%20focus%20to%20the%20toolbar
*/

export default function ToolbarPlugin(editor) {
  editor.on("ready", () => {
    editor.ui.view.toolbar.element.setAttribute("tabindex", "0");
  });
}
