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

import "ckeditor5/ckeditor5.css";
import "./styles.css"; // Should be imported last to take precedence over other editor styles imported above

class Editor extends ClassicEditor {}

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
    ].filter(Boolean),
    mention: CommunityMentionsPlugin.config,
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
          styles: {
            options: ["inline"],
          },
        },
      };
    case "communityPosts":
      return contentEditingConfig;
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

export const createEditor = async (target, options) => {
  await localize(options.baseLocale);

  // Extract field label from aria-labelledby if present
  let fieldLabel = "";
  if (
    target instanceof HTMLTextAreaElement &&
    target.hasAttribute("aria-labelledby")
  ) {
    const labelId = target.getAttribute("aria-labelledby");
    fieldLabel = document.getElementById(labelId)?.textContent || "";
  }

  const config = getEditorConfig(options);

  // Add fieldLabel to config if extracted, removing any asterisks used to denote required fields
  if (fieldLabel) {
    config.label = fieldLabel.replace("*", "");
  }

  const editor = await Editor.create(target, config);
  // Uncomment to enable the CKEditor inspector:
  // import("@ckeditor/ckeditor5-inspector").then(
  //   ({ default: CKEditorInspector }) => {
  //     CKEditorInspector.attach(editor);
  //     return editor;
  //   },
  // );
  return editor;
};

export default Editor;
