import { translate as t } from "../localization";

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
  plugin brings them back.
  - The main editor view label is set to "Rich Text Editor {label}", adding a secondary 
    aria-labelledby with the source element's aria-labelledby, and keeping the default
    aria-labelledby provided by CKEditor
  - The toolbar label is set to "{label} text formatting"
  - The label of the editable area is set via the CKEditor label config option.
*/
/** @type {import("ckeditor5").PluginConstructor} */
export default function AriaAttributesPlugin(editor) {
  /** @type HTMLTextAreaElement | undefined */
  const sourceElement = editor.sourceElement;
  const mainView = editor.ui.view;
  const toolbarView = mainView.toolbar;
  const editableView = mainView.editable;
  const fieldLabel = editor.config.get("label");

  if (fieldLabel) {
    const toolbarLabel = t("help-center-wysiwyg.toolbar_label", {
      label: fieldLabel,
    });

    // Wait for the editor to be ready and then replace the aria-label on the toolbar
    editor.ui.on("ready", () => {
      const toolbarElement = toolbarView.element;
      if (toolbarElement) {
        toolbarElement.setAttribute("aria-label", toolbarLabel);
      }
    });
  }

  if (sourceElement) {
    const mainViewAttributes = getAttributesObject(sourceElement, [
      "aria-labelledby",
    ]);

    mainView.extendTemplate({ attributes: mainViewAttributes });

    // Sets aria-describedby, aria-invalid to the editable element
    const editableViewAttributes = getAttributesObject(sourceElement, [
      "aria-describedby",
      "aria-invalid",
    ]);

    // Sets aria-required to the editable element if required is set on the textarea
    if (sourceElement.hasAttribute("required")) {
      editableViewAttributes["aria-required"] = "true";
    }

    editableView.extendTemplate({ attributes: editableViewAttributes });
  }
}
