import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { contrast } from "../src/theme/palette";
import React from "react";
import { createRoot } from "react-dom/client";
import { CKEditor } from "@ckeditor/ckeditor5-react";

let api;
const editors = [];
const containers = [];
const options = {
  editorType: "communityPosts",
  hasAtMentions: true,
  baseLocale: "en-us",
  userRole: "admin",
  brandId: 123,
};

beforeAll(async () => {
  // Test the real distributable, not a second Vite build of CKEditor/CSS/icons.
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
  vi.unstubAllGlobals();
});

function fixture(shadow = false) {
  const container = document.createElement("div");
  document.body.append(container);
  containers.push(container);
  const root = shadow ? container.attachShadow({ mode: "closed" }) : container;
  const label = document.createElement("label");
  label.id = `label-${containers.length}`;
  label.textContent = "Message *";
  const target = document.createElement("textarea");
  target.setAttribute("aria-labelledby", label.id);
  root.append(label, target);
  return { root, target, container };
}

// Deliberately first: React must not depend on prior standalone initialization.
it("initializes/styles/localizes through React adapter 12 alone", async () => {
  const { container } = fixture();
  const reactRoot = createRoot(container);
  try {
    const editor = await new Promise((resolve, reject) => {
      reactRoot.render(
        React.createElement(CKEditor, {
          editor: api.default,
          config: {
            ...api.getEditorConfig({ ...options, baseLocale: "de" }),
            licenseKey: "GPL",
          },
          onReady: resolve,
          onError: reject,
        }),
      );
    });
    expect(editor.locale.uiLanguage).toBe("de");
    expect(editor.ui.view.toolbar.element.textContent).toContain("Absatz");
    expect(getComputedStyle(editor.ui.getEditableElement()).minHeight).toBe(
      "210px",
    );
    expect(document.querySelectorAll("[data-hc-editor-styles]")).toHaveLength(
      1,
    );
  } finally {
    reactRoot.unmount();
  }
});

it("supports config-only creation, closed-root labels, shared styles and live schemes", async () => {
  const { root, target } = fixture(true);
  const suffix = document.createElement("span");
  suffix.id = "label-suffix";
  suffix.textContent = "details";
  root.append(suffix);
  target.setAttribute(
    "aria-labelledby",
    `${target.getAttribute("aria-labelledby")} ${suffix.id}`,
  );
  const first = await api.default.create({
    ...api.getEditorConfig(options),
    attachTo: target,
    licenseKey: "GPL",
  });
  editors.push(first);
  expect(first.config.get("roots.main.label")).toBe("Message details");
  expect(first.ui.view.toolbar.element.getAttribute("aria-label")).toContain(
    "Message",
  );
  expect(getComputedStyle(first.ui.getEditableElement()).minHeight).toBe(
    "210px",
  );
  const otherTarget = document.createElement("div");
  root.append(otherTarget);
  const second = await api.default.create({
    ...api.getEditorConfig(options),
    attachTo: otherTarget,
    licenseKey: "GPL",
  });
  editors.push(second);
  expect(root.querySelectorAll("[data-hc-editor-styles]")).toHaveLength(1);
  document.documentElement.setAttribute("data-hc-color-scheme", "dark");
  await expect
    .poll(
      () => getComputedStyle(second.ui.getEditableElement()).backgroundColor,
    )
    .toBe("rgb(25, 25, 26)");
  await first.destroy();
  editors.splice(editors.indexOf(first), 1);
  document.documentElement.setAttribute("data-hc-color-scheme", "light");
  await expect
    .poll(
      () => getComputedStyle(second.ui.getEditableElement()).backgroundColor,
    )
    .toBe("rgb(255, 255, 255)");
});

it("installs styles into an independent caller-owned closed overlay root", async () => {
  const { target } = fixture(true);
  const { root: overlay } = fixture(true);
  const editor = await api.default.create({
    ...api.getEditorConfig(options),
    attachTo: target,
    licenseKey: "GPL",
    ui: { overlayContainer: overlay },
  });
  editors.push(editor);
  expect(editor.config.get("ui.viewportOffset.top")).toBe(0);
  expect(overlay.querySelectorAll("[data-hc-editor-styles]")).toHaveLength(1);
  document.documentElement.setAttribute("data-hc-color-scheme", "dark");
  await expect
    .poll(() =>
      getComputedStyle(overlay.host).getPropertyValue(
        "--ck-color-base-background",
      ),
    )
    .toBe("#19191a");
});

it("preserves adjacent/duplicate mention server HTML through reload and clipboard conversion", async () => {
  const { target } = fixture();
  const editor = await api.default.create({
    ...api.getEditorConfig(options),
    attachTo: target,
    licenseKey: "GPL",
  });
  editors.push(editor);
  const html =
    '<p><x-zendesk-user data-user-name="Alex">42</x-zendesk-user><x-zendesk-user data-user-name="Alex">42</x-zendesk-user></p>';
  editor.setData(html);
  expect(editor.getData()).toBe(html);
  editor.setData(editor.getData());
  expect(editor.getData()).toBe(html);
  const mention = editor.model.document
    .getRoot()
    .getChild(0)
    .getChild(0)
    .getAttribute("mention");
  expect(mention.uid).toBeTruthy();
  const fragment = editor.model.getSelectedContent(
    editor.model.createSelection(editor.model.document.getRoot(), "in"),
  );
  const clipboard = editor.data.toView(fragment, { isClipboardPipeline: true });
  const clipboardHtml = editor.data.htmlProcessor.toData(clipboard);
  expect(clipboardHtml).toContain("data-mention=");
  expect(clipboardHtml).not.toContain("data-mention-uid");
});

it("styles real mention suggestions and link actions in both schemes", async () => {
  vi.stubGlobal(
    "fetch",
    async () => new Response(JSON.stringify([{ id: 42, name: "Alex Morgan" }])),
  );
  const { target } = fixture();
  const editor = await api.default.create({
    ...api.getEditorConfig(options),
    attachTo: target,
    licenseKey: "GPL",
  });
  editors.push(editor);
  await userEvent.type(editor.ui.getEditableElement(), "@Alex");
  const overlay = editor.ui.view.body.bodyCollectionContainer;
  await expect
    .poll(() => overlay.querySelector(".hc-mentions__item"))
    .toBeTruthy();
  const item = overlay.querySelector(".hc-mentions__item");
  expect(item.classList.contains("ck-list-item-button")).toBe(true);
  expect(getComputedStyle(item).paddingTop).toBe("8px");
  expect(getComputedStyle(item).display).toBe("flex");
  await userEvent.keyboard("{Escape}");
  const linkButton = editor.ui.componentFactory.create("link");
  linkButton.fire("execute");
  linkButton.destroy();
  const action = overlay.querySelector(".ck-link-form .ck-button-action");
  expect(action).toBeTruthy();
  for (const scheme of ["light", "dark"]) {
    document.documentElement.setAttribute("data-hc-color-scheme", scheme);
    await expect
      .poll(
        () => getComputedStyle(editor.ui.getEditableElement()).backgroundColor,
      )
      .toBe(scheme === "dark" ? "rgb(25, 25, 26)" : "rgb(255, 255, 255)");
    const style = getComputedStyle(action);
    expect(contrast(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
  }
});

it("destroys a comments editor in a real form without registering itself as a plugin", async () => {
  const { target, root } = fixture();
  const form = document.createElement("form");
  root.append(form);
  form.append(target);
  const editor = await api.default.create({
    ...api.getEditorConfig({ ...options, editorType: "comments" }),
    attachTo: target,
    licenseKey: "GPL",
  });
  expect(form.querySelector('input[name="content_type"]').value).toBe(
    "text/html",
  );
  await editor.destroy();
  expect(editor.state).toBe("destroyed");
});

it("only exports the editor class and product-preset builder", () => {
  expect(Object.keys(api).sort()).toEqual(["default", "getEditorConfig"]);
});

it.each(["Custom message", ""])(
  "preserves explicit root label %j and caller configuration",
  async (label) => {
    const { target } = fixture();
    const config = {
      ...api.getEditorConfig(options),
      attachTo: target,
      licenseKey: "GPL",
      root: { label, initialData: "<p>Existing content</p>" },
    };
    const rootConfig = { ...config.root };
    const editor = await api.default.create(config);
    editors.push(editor);
    expect(editor.config.get("roots.main.label")).toBe(label);
    expect(editor.getData()).toBe("<p>Existing content</p>");
    expect(config.root).toEqual(rootConfig);
  },
);

it("infers a label without mutating caller root settings", async () => {
  const { target } = fixture();
  const config = {
    ...api.getEditorConfig(options),
    attachTo: target,
    licenseKey: "GPL",
    root: { initialData: "<p>Existing content</p>" },
  };
  const editor = await api.default.create(config);
  editors.push(editor);
  expect(editor.config.get("roots.main.label")).toBe("Message");
  expect(editor.getData()).toBe("<p>Existing content</p>");
  expect(config.root).toEqual({ initialData: "<p>Existing content</p>" });
});

it("preserves rejected initialization promises and can recreate after failure", async () => {
  const { target } = fixture();
  await expect(
    api.default.create({
      attachTo: target,
      licenseKey: "GPL",
      extraPlugins: [
        function FailingPlugin() {
          throw new Error("controlled creation failure");
        },
      ],
    }),
  ).rejects.toThrow("controlled creation failure");
  const editor = await api.default.create({
    attachTo: target,
    ...api.getEditorConfig(options),
    licenseKey: "GPL",
  });
  editors.push(editor);
  expect(getComputedStyle(editor.ui.getEditableElement()).minHeight).toBe(
    "210px",
  );
});
