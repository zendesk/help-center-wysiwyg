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
    const findAndConvertMentionElements = (children) => {
      for (const child of children) {
        if (child.name === "span" && child.hasAttribute("data-mention")) {
          child.name = "x-zendesk-user";
          child.getChild(0)._textData = child.getAttribute("data-user-id");

          child._classes = new Set();
          child._attrs = new Map();
          child._attrs.set(
            "data-user-name",
            child.getAttribute("data-user-name"),
          );
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
      newMentionElement.classList.add("mention");
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
