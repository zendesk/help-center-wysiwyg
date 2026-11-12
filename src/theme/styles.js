import editorCss from "ckeditor5/ckeditor5.css";
import mentionsCss from "../plugins/CommunityMentionsPlugin/styles.css";
import imagesCss from "../plugins/MarkExternalImagesPlugin/styles.css";
import floraCss from "../styles.css";
import {
  createGardenTheme,
  getEditorVariables,
  resolveScheme,
} from "./adapter";

const css = [editorCss, mentionsCss, imagesCss, floraCss].join("\n");

function install(root) {
  const parent = root.head || root;
  const document = root.ownerDocument || root;
  if (!parent.querySelector("style[data-hc-editor-styles]")) {
    const style = document.createElement("style");
    style.dataset.hcEditorStyles = "";
    style.textContent = css;
    const theme = document.createElement("style");
    theme.dataset.hcEditorTheme = "";
    parent.append(style, theme);
  }
  return parent.querySelector("style[data-hc-editor-theme]");
}

export function installStyles(target, overlayContainer) {
  const document = target.ownerDocument;
  const tree = (node) => {
    const root = node.getRootNode();
    return root.nodeType === 9 || root.nodeType === 11 ? root : document;
  };
  const roots = new Set([tree(target)]);
  if (overlayContainer) roots.add(tree(overlayContainer));
  const themes = [...roots].map(install);

  const update = () => {
    const primaryColor = document.defaultView
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--hc-primary-color");
    const scheme = resolveScheme(
      document.documentElement.getAttribute("data-hc-color-scheme"),
    );
    const variables = getEditorVariables(
      createGardenTheme(primaryColor, scheme),
    );
    const declarations = Object.entries(variables)
      .map(([key, value]) => `${key}:${value}`)
      .join(";");
    const themeCss = `:root,:host{${declarations}}`;
    for (const theme of themes) {
      if (theme.textContent !== themeCss) theme.textContent = themeCss;
    }
  };
  update();
  const observer = new document.defaultView.MutationObserver(update);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-hc-color-scheme"],
  });
  // Each editor owns only its observer. Marked styles stay for the next editor.
  return () => observer.disconnect();
}
