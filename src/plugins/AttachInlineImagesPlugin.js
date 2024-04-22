/*
  This plugin will listen to image uploads in the editor and add the uploaded
  attachment tokens that it receives, to the form as hidden inputs.

  If we did not do this, the attachments would eventually expire and disappear
  from the support ticket.
*/
export default function AttachInlineImagesPlugin(editor) {
  const form = editor.sourceElement?.form;

  if (!form)
    throw new Error("AttachInlineImagesPlugin: No form found for editor");

  editor.plugins
    .get("ImageUploadEditing")
    .on("uploadComplete", (_, { data }) => {
      const {
        token,
        urls: { default: src },
      } = data;

      const input = document.createElement("input");
      input.hidden = true;
      input.name = "request[attachments][]";
      input.value = JSON.stringify({ id: token, inline: true, _src: src });

      form.appendChild(input);
    });

  // We intercept form submissions in order to clear out any inline attachments
  // that may have been removed from the editor by the user.
  // Otherwise, they would needlessly get included in the request.
  form.addEventListener(
    "submit",
    (evt) => {
      evt.preventDefault();
      evt.stopPropagation();

      const data = editor.getData();
      const doc = new DOMParser().parseFromString(data, "text/html");

      document
        .querySelectorAll("input[name='request[attachments][]']")
        .forEach((input) => {
          const { inline, _src } = JSON.parse(input.value);
          if (!inline) return;
          if (!doc.querySelector(`img[src="${_src}"]`)) input.remove();
        });

      setTimeout(form.submit.bind(form), 0);
    },
    true, // (useCapture) important, as we want to run this before the default submit handler
  );
}
