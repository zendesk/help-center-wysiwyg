/*
  This plugin is responsible submitting the form "manually",
  since otherwise the CSRF-token will not be attached.
*/
export default function FormSubmissionPlugin(editor) {
  const form = editor.sourceElement?.form;

  if (!form) return;

  const onSubmit = (evt) => {
    evt.preventDefault();
    form.submit();
  };
  form.addEventListener("submit", onSubmit);
  // Request attachment cleanup owns capture-phase submission while active.
  // Do not leave this fallback listener behind after its editor is destroyed.
  editor.once("destroy", () => form.removeEventListener("submit", onSubmit));
}
