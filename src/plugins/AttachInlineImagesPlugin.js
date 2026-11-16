/*
  This plugin will listen to image uploads in the editor and add the uploaded
  attachment tokens that it receives, to the form as hidden inputs.

  If we did not do this, the attachments would eventually expire and disappear
  from the support ticket.
*/
const formSubmissions = new WeakMap();

export default function AttachInlineImagesPlugin(editor) {
  const form = editor.sourceElement?.form;

  if (!form)
    throw new Error("AttachInlineImagesPlugin: No form found for editor");

  const uploadEditing = editor.plugins.get("ImageUploadEditing");
  const onUpload = (_, { data }) => {
    const {
      token,
      urls: { default: src },
    } = data;

    const input = document.createElement("input");
    input.hidden = true;
    input.name = "request[attachments][]";
    input.value = JSON.stringify({ id: token, inline: true, _src: src });

    form.appendChild(input);
  };
  uploadEditing.on("uploadComplete", onUpload);

  // Cleanup and submission belong to the form: a request can have multiple
  // editors, and an attachment used by any of them must remain attached.
  let submission = formSubmissions.get(form);
  if (!submission) {
    submission = { editors: new Set(), pendingSubmit: undefined };
    submission.onSubmit = (evt) => {
      evt.preventDefault();
      evt.stopPropagation();

      const documents = Array.from(submission.editors, (instance) =>
        new DOMParser().parseFromString(instance.getData(), "text/html"),
      );
      // Query the owning form so this also works inside a shadow root.
      form
        .querySelectorAll("input[name='request[attachments][]']")
        .forEach((input) => {
          const { inline, _src } = JSON.parse(input.value);
          if (!inline) return;
          if (!documents.some((doc) => doc.querySelector(`img[src="${_src}"]`)))
            input.remove();
        });

      clearTimeout(submission.pendingSubmit);
      submission.pendingSubmit = setTimeout(form.submit.bind(form), 0);
    };
    formSubmissions.set(form, submission);
    // Run cleanup before the default submit handler and its native submission.
    form.addEventListener("submit", submission.onSubmit, true);
  }
  submission.editors.add(editor);

  editor.once("destroy", () => {
    uploadEditing.off("uploadComplete", onUpload);
    submission.editors.delete(editor);
    if (submission.editors.size) return;
    form.removeEventListener("submit", submission.onSubmit, true);
    clearTimeout(submission.pendingSubmit);
    formSubmissions.delete(form);
  });
}
