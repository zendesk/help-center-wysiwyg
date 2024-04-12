/*
  This plugin is responsible submitting the form "manually",
  since otherwise the CSRF-token will not be attached.
*/
export default function FormSubmissionPlugin(editor) {
  const form = editor.sourceElement?.form;

  if (!form) return;

  form.addEventListener("submit", (evt) => {
    evt.preventDefault();
    form.submit();
  });
}
