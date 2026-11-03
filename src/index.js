// Native plugins
import {
  BlockQuote,
  Bold,
  ClassicEditor,
  Code,
  CodeBlock,
  Essentials,
  Heading,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Italic,
  Link,
  List,
  Mention,
  Notification,
  Paragraph,
  PasteFromOffice,
  TextTransformation,
} from "ckeditor5";

// Custom plugins
import AriaAttributesPlugin from "./plugins/AriaAttributesPlugin";
import AttachInlineImagesPlugin from "./plugins/AttachInlineImagesPlugin";
import AUSImageUploadPlugin from "./plugins/AUSImageUploadPlugin";
import CommunityMentionsPlugin from "./plugins/CommunityMentionsPlugin";
import FormSubmissionPlugin from "./plugins/FormSubmissionPlugin";
import HiddenFormFields from "./plugins/HiddenFormFieldsPlugin";
import MarkExternalImagesPlugin from "./plugins/MarkExternalImagesPlugin";
import SyncTextareaPlugin from "./plugins/SyncTextareaPlugin";
import TestIdPlugin from "./plugins/TestIdPlugin";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import XHRImageUploadPlugin from "./plugins/XHRImageUploadPlugin";

import { localize } from "./localization";

import { acquireStyles } from "./theme/styles";

function getSourceLabel(target) {
  if (target?.tagName !== "TEXTAREA") return "";

  const tree = target.getRootNode();
  return (target.getAttribute("aria-labelledby") || "")
    .split(/\s+/)
    .map((id) => tree.getElementById?.(id)?.textContent || "")
    .join(" ")
    .replaceAll("*", "")
    .replace(/\s+/g, " ")
    .trim();
}

class Editor extends ClassicEditor {
  static async create(config = {}) {
    // Infer a default for the single-root shorthand; explicit root settings win.
    const label = getSourceLabel(config.attachTo);
    if (label && !config.roots && config.root?.label === undefined) {
      config = { ...config, root: { ...config.root, label } };
    }

    await localize(
      typeof config.language === "string"
        ? config.language
        : config.language?.ui || "en-us",
    );
    const target = config.attachTo;
    // Detached config-only editors use the document until attached by the caller.
    const release = acquireStyles(
      target || document.body,
      config.ui?.overlayContainer,
    );
    try {
      const editor = await super.create(config);
      const destroy = editor.destroy.bind(editor);
      editor.destroy = async () => {
        try {
          return await destroy();
        } finally {
          release();
        }
      };
      return editor;
    } catch (error) {
      release();
      throw error;
    }
  }
}

Editor.builtinPlugins = [
  BlockQuote,
  Bold,
  Code,
  CodeBlock,
  Essentials,
  Heading,
  Image,
  ImageCaption,
  ImageResize,
  ImageToolbar,
  ImageStyle,
  ImageUpload,
  Italic,
  Link,
  List,
  Notification,
  Paragraph,
  PasteFromOffice,
  TextTransformation,
  FormSubmissionPlugin,
  TestIdPlugin,
  ToolbarPlugin,
];

Editor.defaultConfig = {
  toolbar: {
    items: [
      "heading",
      "|",
      "bold",
      "italic",
      "code",
      "|",
      "codeBlock",
      "link",
      "bulletedList",
      "numberedList",
      "|",
      "imageUpload",
      "blockQuote",
      "undo",
      "redo",
    ],
  },
  link: {
    defaultProtocol: "https://",
  },
  codeBlock: {
    languages: [{ language: "plaintext", label: "Plain text" }],
  },
  ui: {
    viewportOffset: {
      // make sure the toolbar is not hidden behind the navbar
      top: document.querySelector("zd-hc-navbar")?.offsetHeight || 0,
    },
  },
  image: {
    upload: {
      types: ["jpeg", "png", "gif"],
    },
  },
};

/**
 * Get the configuration for the editor based on the editor type.
 * @param {Object} baseConfig - Base configuration
 * @param {string} baseConfig.editorType - The type of the editor (comments, communityPosts, or supportRequests).
 * @param {boolean} baseConfig.hasAtMentions - At-mentions enabled or not
 * @param {string} baseConfig.userRole - The user role
 * @param {number} baseConfig.brandId - The brand id
 * @param {string} baseConfig.baseLocale - The base locale
 * @returns {EditorConfig} The configuration for the editor. See https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-EditorConfig.html
 * @throws {Error} If no configuration exists for the specified editor type.
 */
export const getEditorConfig = ({
  editorType,
  hasAtMentions,
  userRole,
  brandId,
  baseLocale,
}) => {
  const isUserUnauthenticated = userRole === "anonymous";

  const baseConfig = {
    /* eslint-disable no-undef */
    licenseKey:
      process.env.NODE_ENV === "production"
        ? process.env.CKEDITOR_LICENSE_KEY_PRODUCTION
        : process.env.CKEDITOR_LICENSE_KEY_DEVELOPMENT || "GPL",
    /* eslint-enable no-undef */
    language: baseLocale,
  };

  const contentEditingConfig = {
    ...baseConfig,
    extraPlugins: [
      hasAtMentions && Mention,
      hasAtMentions && CommunityMentionsPlugin,
      AUSImageUploadPlugin,
      MarkExternalImagesPlugin,
      AriaAttributesPlugin,
    ].filter(Boolean),
    mention: CommunityMentionsPlugin.config,
    imageUpload: {
      brandId,
    },
  };

  switch (editorType) {
    case "comments":
      return {
        ...contentEditingConfig,
        extraPlugins: [...contentEditingConfig.extraPlugins, HiddenFormFields],
        hiddenFormFields: {
          fields: [
            ["content_type", "text/html"], // required for content to be processed properly by the server
          ],
        },
        image: {
          toolbar: ["imageTextAlternative"],
          styles: {
            options: ["inline"],
          },
        },
      };
    case "communityPosts":
      return {
        ...contentEditingConfig,
        image: {
          toolbar: [
            "imageTextAlternative",
            "|",
            "imageStyle:inline",
            "imageStyle:block",
            "imageStyle:alignLeft",
            "imageStyle:alignRight",
            "imageStyle:alignBlockLeft",
            "imageStyle:alignBlockRight",
            "|",
            "toggleImageCaption",
          ],
        },
      };
    case "supportRequests":
      return {
        ...baseConfig,
        extraPlugins: [
          XHRImageUploadPlugin,
          AttachInlineImagesPlugin,
          AriaAttributesPlugin,
          SyncTextareaPlugin,
        ],
        removePlugins: [isUserUnauthenticated && "Image"].filter(Boolean),
        toolbar: {
          removeItems: [isUserUnauthenticated && "imageUpload"].filter(Boolean),
        },
        imageUpload: {
          endpoint: "/hc/request_uploads",
          urlFromResponse: (response) => response.url,
        },
        image: {
          toolbar: ["imageTextAlternative"],
          styles: {
            options: ["inline"],
          },
        },
      };
    default: {
      throw new Error(
        `No configuration exists for editor type: "${editorType}"`,
      );
    }
  }
};

export default Editor;
