import { afterEach, beforeAll, expect, vi } from "vitest";
import { userEvent } from "vitest/browser";

export let api;
export const editors = [];
export const containers = [];
export const options = {
  editorType: "communityPosts",
  hasAtMentions: true,
  baseLocale: "en-us",
  locale: "en-us",
  userRole: "admin",
  brandId: 123,
};

beforeAll(async () => {
  // Exercise webpack's actual CSS, icons, translations and public distribution.
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/dist/main.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
  api = window.HelpCenterWysiwyg;
});

afterEach(async () => {
  for (const editor of editors.splice(0)) await editor.destroy();
  for (const container of containers.splice(0)) container.remove();
  document.documentElement.removeAttribute("data-hc-color-scheme");
  document.documentElement.style.removeProperty("--hc-primary-color");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

export function fixture(shadow = false) {
  const container = document.createElement("section");
  container.style.width = "1000px";
  document.body.append(container);
  containers.push(container);
  const root = shadow ? container.attachShadow({ mode: "closed" }) : container;
  // A larger component owns the root, not the editor. The form is root-local.
  const content = document.createElement("article");
  content.innerHTML = `<h2>Contact us</h2><form><label id="message">Message *</label><span id="details">details</span><textarea name="message" aria-labelledby="message details"></textarea><button type="submit">Send</button></form>`;
  root.append(content);
  const form = content.querySelector("form");
  const submit = vi.spyOn(form, "submit").mockImplementation(() => {});
  return {
    root,
    container,
    form,
    submit,
    target: form.querySelector("textarea"),
  };
}

export async function create(target, overrides = {}, product = {}) {
  const editor = await api.default.create({
    ...api.getEditorConfig({ ...options, ...product }),
    attachTo: target,
    licenseKey: "GPL",
    ...overrides,
  });
  editors.push(editor);
  return editor;
}

export async function type(editor, text) {
  editor.editing.view.focus();
  // Keyboard events use the focused element, including in retained closed roots.
  await userEvent.keyboard(text);
}

export async function openLink(editor) {
  editor.ui.view.toolbar.element
    .querySelector("button[data-cke-tooltip-text^='Insert/Edit link']")
    .click();
  const overlay = editor.ui.view.body.bodyCollectionContainer;
  await expect
    .poll(() => overlay.querySelector(".ck-link-form input"))
    .toBeTruthy();
  return overlay.querySelector(".ck-link-form");
}
