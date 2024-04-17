import debounce from "lodash.debounce";
import { translate as t } from "../../localization";
import MentionsDataProcessor from "./MentionsDataProcessor";
import { Mention } from "@ckeditor/ckeditor5-mention";
import { Notification } from "@ckeditor/ckeditor5-ui";

import "./styles.css";

const MAX_MENTIONS_COUNT = 15;

const sendQuery = async (query) => {
  const response = await fetch(
    `/hc/api/internal/communities/mentions.json?query=${query}`,
  );
  return response.ok ? response.json() : Promise.reject(response);
};

const getMentionsCount = () => {
  const data = _editor.getData();
  const doc = new DOMParser().parseFromString(data, "text/html");
  return doc.body.querySelectorAll("x-zendesk-user").length;
};

let _editor;

function CommunityMentionsPlugin(editor) {
  _editor = editor;
  editor.data.processor = new MentionsDataProcessor(editor);

  // This converter takes <span data-mention> elements
  // and converts them to the mentions attribute model.
  editor.conversion.for("upcast").elementToAttribute({
    view: {
      name: "span",
      key: "data-mention",
      classes: "mention",
      attributes: { "data-user-id": true },
    },
    model: {
      key: "mention",
      value: (viewItem) =>
        editor.plugins.get("Mention").toMentionAttribute(viewItem, {
          userId: viewItem.getAttribute("data-user-id"),
          userName: viewItem.getAttribute("data-mention"),
        }),
    },
    converterPriority: "high",
  });

  // This converter takes any mention model attributes
  // and converts them to <span data-mention> elements.
  editor.conversion.for("downcast").attributeToElement({
    model: "mention",
    view: (modelAttributeValue, { writer }) => {
      if (!modelAttributeValue) return;

      return writer.createAttributeElement(
        "span",
        {
          class: "mention",
          "data-user-name": modelAttributeValue.userName,
          "data-user-id": modelAttributeValue.userId,
          "data-mention": modelAttributeValue.uid,
        },
        {
          priority: 20, // Make mention attribute to be wrapped by other attribute elements.
          id: modelAttributeValue.uid, // Prevent merging mentions together.
        },
      );
    },
    converterPriority: "high",
  });

  const mention = editor.plugins.get(Mention);
  const notification = editor.plugins.get(Notification);

  editor.model.document.on(
    "change:data",
    debounce(() => {
      const count = getMentionsCount();
      mention.set("count", count);
    }, 600),
  );

  mention.on("change:count", (evt, propertyName, newValue, oldValue) => {
    if (newValue === MAX_MENTIONS_COUNT) {
      notification.showWarning("Mentions limit reeched", {
        namespace: "mention:limit",
        title: t("help-center-wysiwyg.mentionable_user_limit_exceeded"),
      });
    }

    if (oldValue === MAX_MENTIONS_COUNT && newValue < MAX_MENTIONS_COUNT) {
      notification.showSuccess("Mentions within limit", {
        namespace: "mention:limit",
      });
    }
  });
}

CommunityMentionsPlugin.config = {
  dropdownLimit: 10,
  feeds: [
    {
      marker: "@",
      minimumCharacters: 1,
      feed: async (query) => {
        const mentionsCount = getMentionsCount();

        if (mentionsCount >= MAX_MENTIONS_COUNT) {
          return Promise.resolve([]);
        }

        const results = await sendQuery(query);

        return results.map((item) => ({
          id: `@${item.name}`,
          userId: item.id,
          userName: item.name,
          avatarUrl: item.avatar_url,
        }));
      },
      itemRenderer: (item) => {
        const itemElement = document.createElement("div");
        itemElement.classList.add("hc-mentions__item");
        itemElement.setAttribute(
          "data-test-id",
          `at-mentions-suggestion-${item.userId}`,
        );

        const nameElement = document.createElement("span");
        nameElement.classList.add("hc-mentions__name");
        nameElement.innerText = item.userName;

        if (item.avatarUrl) {
          const avatarElement = document.createElement("div");
          avatarElement.classList.add("hc-mentions__avatar");
          avatarElement.style.backgroundImage = `url(${item.avatarUrl})`;

          itemElement.append(avatarElement);
        }

        itemElement.append(nameElement);

        return itemElement;
      },
    },
  ],
};

export default CommunityMentionsPlugin;
