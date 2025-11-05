/**
 * Return an object containing attribute keys and respective values taken from the source element
 * @param {HTMLTextAreaElement} sourceElement The source textarea element
 * @param {string[]} attributeNames list of attributes name to copy
 * @returns {Record<string, string>} Attribute names and value
 */
function getAttributesObject(sourceElement, attributeNames) {
  const res = {};

  for (const attributeName of attributeNames) {
    if (sourceElement.hasAttribute(attributeName)) {
      res[attributeName] = sourceElement.getAttribute(attributeName);
    }
  }

  return res;
}

/* 
  This plugin will copy some ARIA attributes from the original textarea element to
  the CKEditor. This is useful for A11Y, since the original element can be labeled by
  another element, can be set to be required on invalid, and can have a description or 
  an error linked to it.

  All of this information is lost when the textarea is replaced by the editor, and this
  plugin brings them back. The label is set on the main element, since it is the first one read 
  by screen readers, while other attributes are set on the editable element.
*/
/** @type {import("@ckeditor/ckeditor5-core").PluginConstructor} */
export default function AriaAttributesPlugin(editor) {
  /** @type HTMLTextAreaElement | undefined */
  const sourceElement = editor.sourceElement;
  const mainView = editor.ui.view;
  const editableView = editor.ui.view.editable;

  if (sourceElement) {
    // Sets aria-labelledby to the main editor element
    const mainViewAttributes = getAttributesObject(sourceElement, [
      "aria-labelledby",
    ]);

    mainView.extendTemplate({
      attributes: mainViewAttributes,
    });

    // Sets aria-describedby, aria-invalid, aria-label, aria-labelledby to the editable element
    const editableViewAttributes = getAttributesObject(sourceElement, [
      "aria-describedby",
      "aria-invalid",
      "aria-label",
      "aria-labelledby",
    ]);

    // Sets aria-required to the editable element if required is set on the textarea
    if (sourceElement.hasAttribute("required")) {
      editableViewAttributes["aria-required"] = "true";
    }

    editableView.extendTemplate({ attributes: editableViewAttributes });
  }
}
