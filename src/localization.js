import { add } from "@ckeditor/ckeditor5-utils/src/translation-service";

export const ckeditorTranslationsKeyMap = {
  Bold: "help-center-wysiwyg.bold",
  Italic: "help-center-wysiwyg.italic",
  Link: "help-center-wysiwyg.link",
  Code: "help-center-wysiwyg.code",
  "Insert image": "help-center-wysiwyg.insert-image",
  "Block quote": "help-center-wysiwyg.block-quote",
  "Insert code block": "help-center-wysiwyg.insert-code-block",
  "Bulleted List": "help-center-wysiwyg.bulleted-list",
  "Numbered List": "help-center-wysiwyg.numbered-list",
  Heading: "help-center-wysiwyg.heading",
  "Heading 1": "help-center-wysiwyg.heading-1",
  "Heading 2": "help-center-wysiwyg.heading-2",
  "Heading 3": "help-center-wysiwyg.heading-3",
  Paragraph: "help-center-wysiwyg.paragraph",
  "Choose heading": "help-center-wysiwyg.choose-heading",
  "Change image text alternative":
    "help-center-wysiwyg.change-image-text-alternative",
  "Text alternative": "help-center-wysiwyg.text-alternative",
  Save: "help-center-wysiwyg.save",
  Cancel: "help-center-wysiwyg.cancel",
  "In line": "help-center-wysiwyg.in-line",
  "Left aligned image": "help-center-wysiwyg.left-aligned-image",
  "Right aligned image": "help-center-wysiwyg.right-aligned-image",
  "Centered image": "help-center-wysiwyg.centered-image",
  "Side image": "help-center-wysiwyg.side-image",
  "Toggle caption on": "help-center-wysiwyg.toggle-caption-on",
  "Toggle caption off": "help-center-wysiwyg.toggle-caption-off",
  "Plain text": "help-center-wysiwyg.plain-text",
  "Upload failed": "help-center-wysiwyg.upload-failed",
  "Link URL": "help-center-wysiwyg.link-url",
  "Edit link": "help-center-wysiwyg.edit-link",
  Unlink: "help-center-wysiwyg.unlink",
  Undo: "help-center-wysiwyg.undo",
  Redo: "help-center-wysiwyg.redo",
  "Enter image caption": "help-center-wysiwyg.enter-image-caption",
  "Show more items": "help-center-wysiwyg.show-more-items",
  "Editor toolbar": "help-center-wysiwyg.editor-toolbar",
};

const getTranslations = (keyMap) =>
  Object.fromEntries(
    Object.entries(keyMap).map(([text, key]) => [text, translate(key)]),
  );

let translationStore = {};

export const localize = async (baseLocale) => {
  const { translations } = await import(`../translations/${baseLocale}.json`);

  translationStore = translations;

  add(baseLocale, getTranslations(ckeditorTranslationsKeyMap));
};

export function translate(key, args) {
  let translation = translationStore[key];

  if (typeof translation !== "undefined" && typeof args === "object") {
    for (const [key, value] of Object.entries(args)) {
      translation = translation.replaceAll(`{{${key}}}`, value);
    }
  }

  return translation;
}
