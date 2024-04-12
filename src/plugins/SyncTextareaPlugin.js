/*
  This plugin synchronizes CKEditor data with the original textarea and
  triggers an 'input' event for compatibility with forms expecting textarea updates, 
  such as in the Copenhagen Theme. Reference: 
  https://github.com/zendesk/copenhagen_theme/blob/master/src/forms.js#L102
*/

export default function SyncTextareaPlugin(editor) {
  editor.model.document.on("change:data", () => {
    const editorData = editor.getData();
    const editorSourceElement = editor.sourceElement;

    editorSourceElement.value = editorData;
    editorSourceElement.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
