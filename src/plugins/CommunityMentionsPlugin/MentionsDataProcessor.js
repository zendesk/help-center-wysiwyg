import { ViewUpcastWriter } from "ckeditor5";

// This custom DataProcessor is responsible for converting the rich text going to and from the server.
// It is required due to the way the native CKEditor Mention plugin works.
// The plugin expects the text content of the mention elements to always be the user's name,
// but we want to send the user's ID to the server and vice-versa.
class MentionsDataProcessor {
  constructor(editor) {
    this._editor = editor;
  }

  // This method takes the view fragments coming from the editor,
  // converts all <span data-mention> elements into <x-zendesk-user> elements.
  // The result is what will be sent to the server.
  toData(viewFragment) {
    const writer = new ViewUpcastWriter(viewFragment.document);

    const findAndConvertMentionElements = (children) => {
      for (const child of children) {
        if (child.name === "span" && child.hasAttribute("data-mention")) {
          const userName = child.getAttribute("data-user-name");
          const userId = child.getAttribute("data-user-id");

          const renamedElement = writer.rename("x-zendesk-user", child);

          if (renamedElement.childCount > 0) {
            const textNode = renamedElement.getChild(0);
            if (textNode.is("$text")) {
              writer.remove(textNode);
              writer.appendChild(writer.createText(userId), renamedElement);
            }
          }

          const attributeKeys = Array.from(renamedElement.getAttributeKeys());
          for (const key of attributeKeys) {
            writer.removeAttribute(key, renamedElement);
          }
          writer.setAttribute("data-user-name", userName, renamedElement);
        } else if (child.getChildren) {
          findAndConvertMentionElements(child.getChildren());
        }
      }
    };
    findAndConvertMentionElements(viewFragment.getChildren());

    return this._editor.data.htmlProcessor.toData(viewFragment);
  }

  // This method takes the data coming from the server (a string of HTML),
  // parses it into a DOM, converts all <x-zendesk-user> elements into <span data-mention> elements.
  // The result will be sent to the editor.
  toView(dataFragment) {
    const DOMParser = new window.DOMParser();
    const parsedDOM = DOMParser.parseFromString(dataFragment, "text/html");
    const mentions = parsedDOM.querySelectorAll("x-zendesk-user");

    mentions.forEach((oldMentionElement) => {
      const userId = oldMentionElement.textContent;
      const userName = oldMentionElement.getAttribute("data-user-name");

      const newMentionElement = parsedDOM.createElement("span");
      newMentionElement.setAttribute("class", "mention");
      newMentionElement.setAttribute("data-user-id", userId);
      newMentionElement.setAttribute("data-mention", userName);
      newMentionElement.textContent = `@${userName}`;

      oldMentionElement.parentElement.replaceChild(
        newMentionElement,
        oldMentionElement,
      );
    });

    return this._editor.data.htmlProcessor.toView(parsedDOM.body.innerHTML);
  }
}

export default MentionsDataProcessor;
