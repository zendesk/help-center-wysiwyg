import editorCss from "ckeditor5/ckeditor5.css";
import mentionsCss from "../plugins/CommunityMentionsPlugin/styles.css";
import imagesCss from "../plugins/MarkExternalImagesPlugin/styles.css";
import floraCss from "../styles.css";
import { createThemeTokens, resolveScheme } from "./palette";

// CSS strings are processed by the production webpack/css-loader pipeline.
// A style tag is deliberately used instead of constructed sheets: no CSS import
// restrictions, works in closed roots, and never mutates adoptedStyleSheets.
const css = [editorCss, mentionsCss, imagesCss, floraCss].join("\n");
const roots = new WeakMap();
const documents = new WeakMap();

function install(root) {
  let state = roots.get(root);
  if (!state) {
    const document = root.ownerDocument || root;
    const style = document.createElement("style");
    style.dataset.hcEditorStyles = "";
    style.textContent = css;
    const theme = document.createElement("style");
    theme.dataset.hcEditorTheme = "";
    (root.head || root).append(style, theme);
    state = { theme, users: 0 };
    roots.set(root, state);
  }
  return state;
}

export function acquireStyles(target, overlayContainer) {
  const document = target.ownerDocument;
  let state = documents.get(document);
  if (!state) {
    state = {
      roots: new Map(),
      primaryColor: document.defaultView
        .getComputedStyle(document.documentElement)
        .getPropertyValue("--hc-primary-color"),
      scheme: null,
      themeCss: "",
    };
    documents.set(document, state);
  }
  const update = () => {
    const scheme = resolveScheme(
      document.documentElement.getAttribute("data-hc-color-scheme"),
    );
    if (state.scheme !== scheme) {
      const declarations = Object.entries(
        createThemeTokens(state.primaryColor, scheme),
      )
        .map(([key, value]) => `${key}:${value}`)
        .join(";");
      state.themeCss = `:root,:host{${declarations}}`;
      state.scheme = scheme;
    }
    for (const rootState of state.roots.values()) {
      if (rootState.theme.textContent !== state.themeCss) {
        rootState.theme.textContent = state.themeCss;
      }
    }
  };
  const tree = (node) => {
    const root = node.getRootNode();
    return root.nodeType === 9 || root.nodeType === 11 ? root : document;
  };
  const targets = new Set([tree(target)]);
  if (overlayContainer) {
    targets.add(
      overlayContainer.nodeType === 11
        ? overlayContainer
        : tree(overlayContainer),
    );
  }
  for (const root of targets) {
    const rootState = install(root);
    rootState.users++;
    state.roots.set(root, rootState);
  }
  if (!state.observer) {
    state.observer = new document.defaultView.MutationObserver(update);
    state.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-hc-color-scheme"],
    });
  }
  update();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const root of targets) {
      const rootState = state.roots.get(root);
      if (--rootState.users === 0) state.roots.delete(root);
    }
    if (!state.roots.size) {
      state.observer.disconnect();
      state.observer = null;
    }
  };
}
