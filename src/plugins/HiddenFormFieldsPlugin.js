/*
  This plugin is responsible adding any hidden fields to the form of CKEditor.
*/
export default function HiddenFormFields(editor) {
  const form = editor.sourceElement?.form;

  if (!form) return;

  if (!Array.isArray(editor.config.get("hiddenFormFields.fields")))
    throw new Error(
      "HiddenFormFieldsPlugin: config.hiddenFormFields.fields must be an array of [name, value] pairs",
    );

  editor.config.get("hiddenFormFields.fields").forEach(([name, value]) => {
    const hiddenField = document.createElement("input");
    hiddenField.type = "hidden";
    hiddenField.name = name;
    hiddenField.value = value;

    form.appendChild(hiddenField);
  });

  return editor;
}
