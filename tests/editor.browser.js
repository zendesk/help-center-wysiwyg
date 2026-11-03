import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import {
  DEFAULT_THEME,
  IconButton,
  ThemeProvider,
} from "@zendeskgarden/react-components";
import { createThemeTokens } from "../src/theme/palette";
import { contrast } from "./contrast";
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

it("shares branded Garden tokens across document and closed roots without changing host attributes", async () => {
  // A fresh document ensures branding is read before its first editor initializes.
  const frame = document.createElement("iframe");
  document.body.append(frame);
  containers.push(frame);
  const page = frame.contentDocument;
  const html = page.documentElement;
  html.style.setProperty("--hc-primary-color", "blue");
  html.style.setProperty("--hc-primary-color-700", "host-owned-palette");
  html.setAttribute("data-hc-color-scheme", "dark");
  await new Promise((resolve, reject) => {
    const script = page.createElement("script");
    script.src = "/dist/main.js";
    script.onload = resolve;
    script.onerror = reject;
    page.head.append(script);
  });
  const Editor = frame.contentWindow.HelpCenterWysiwyg.default;
  const regularTarget = page.createElement("div");
  const host = page.createElement("div");
  const overlayHost = page.createElement("div");
  page.body.append(regularTarget, host, overlayHost);
  const root = host.attachShadow({ mode: "closed" });
  const overlay = overlayHost.attachShadow({ mode: "closed" });
  const shadowTarget = page.createElement("div");
  root.append(shadowTarget);
  const regular = await Editor.create({
    attachTo: regularTarget,
    licenseKey: "GPL",
  });
  editors.push(regular);
  const shadow = await Editor.create({
    attachTo: shadowTarget,
    licenseKey: "GPL",
    ui: { overlayContainer: overlay },
  });
  editors.push(shadow);
  const stylesheet = root.querySelector("[data-hc-editor-styles]");
  const expected = {
    light: createThemeTokens("blue", "light"),
    dark: createThemeTokens("blue", "dark"),
  };
  for (const scheme of ["dark", "light", "unknown"]) {
    html.setAttribute("data-hc-color-scheme", scheme);
    const tokens = expected[scheme === "dark" ? "dark" : "light"];
    for (const element of [html, host, overlayHost]) {
      await expect
        .poll(() =>
          frame.contentWindow
            .getComputedStyle(element)
            .getPropertyValue("--ck-color-link-default")
            .trim(),
        )
        .toBe(tokens["--ck-color-link-default"]);
      expect(
        frame.contentWindow
          .getComputedStyle(element)
          .getPropertyValue("--ck-color-base-background")
          .trim(),
      ).toBe(tokens["--ck-color-base-background"]);
    }
    expect(root.querySelector("[data-hc-editor-styles]")).toBe(stylesheet);
    expect(root.querySelectorAll("[data-hc-editor-styles]")).toHaveLength(1);
    expect(host.attributes).toHaveLength(0);
    expect(overlayHost.attributes).toHaveLength(0);
  }
  expect(html.style.getPropertyValue("--hc-primary-color")).toBe("blue");
  expect(html.style.getPropertyValue("--hc-primary-color-700")).toBe(
    "host-owned-palette",
  );
  // Branding stays static even when the host changes it and toggles the scheme.
  html.style.setProperty("--hc-primary-color", "red");
  html.setAttribute("data-hc-color-scheme", "dark");
  await expect
    .poll(() =>
      frame.contentWindow
        .getComputedStyle(host)
        .getPropertyValue("--ck-color-link-default")
        .trim(),
    )
    .toBe(expected.dark["--ck-color-link-default"]);
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

it.each([
  { shadow: false, language: "en-us" },
  { shadow: true, language: "ar" },
])(
  "matches squared Garden icon buttons, focus and menu states ($language, shadow=$shadow)",
  async ({ shadow, language }) => {
    const { target } = fixture(shadow);
    const editor = await api.default.create({
      ...api.getEditorConfig({ ...options, baseLocale: language }),
      attachTo: target,
      licenseKey: "GPL",
    });
    editors.push(editor);
    editor.setData("<p>Example</p>");
    const bold = editor.ui.view.toolbar.element.querySelector(
      "button[aria-pressed]",
    );
    const normalize = (value, property = "color") => {
      const element = document.createElement("span");
      element.style.setProperty(property, value);
      document.body.append(element);
      const result = getComputedStyle(element).getPropertyValue(property);
      element.remove();
      return result;
    };
    const reference = document.createElement("div");
    document.body.append(reference);
    containers.push(reference);
    const reactRoot = createRoot(reference);
    const style = (element) => getComputedStyle(element);
    try {
      for (const scheme of ["light", "dark"]) {
        document.documentElement.setAttribute("data-hc-color-scheme", scheme);
        const theme = {
          ...DEFAULT_THEME,
          colors: { ...DEFAULT_THEME.colors, base: scheme },
        };
        reactRoot.render(
          React.createElement(
            ThemeProvider,
            { theme },
            React.createElement(
              IconButton,
              {
                isPill: false,
                size: "small",
                "aria-label": "Garden reference",
              },
              React.createElement(
                "svg",
                { viewBox: "0 0 20 20" },
                React.createElement("path", { d: "M4 4h12v12H4z" }),
              ),
            ),
          ),
        );
        await expect.poll(() => reference.querySelector("button")).toBeTruthy();
        const button = reference.querySelector("button");
        const tokens = createThemeTokens(undefined, scheme);
        // Wait for both libraries' transitions and the host scheme observer.
        await expect
          .poll(() => style(button).color)
          .toBe(normalize(tokens["--ck-button-default-text-color"]));
        await expect.poll(() => style(bold).color).toBe(style(button).color);
        expect(style(bold).borderRadius).toBe(style(button).borderRadius);
        expect(style(bold).minHeight).toBe(style(button).height);
        await userEvent.hover(button);
        await expect
          .poll(() => style(button).backgroundColor)
          .toBe(normalize(tokens["--ck-color-base-hover"]));
        await expect
          .poll(() => style(button).color)
          .toBe(normalize(tokens["--ck-button-default-hover-text-color"]));
        const hoverBackground = style(button).backgroundColor;
        const hoverForeground = style(button).color;
        // Vitest's locator-based pointer API cannot address a closed root.
        // Exercise real pointer hover in regular DOM; focus/toggle states below
        // use retained references and are checked in both trees.
        if (!shadow) {
          await userEvent.hover(bold);
          await expect
            .poll(() => style(bold).backgroundColor)
            .toBe(hoverBackground);
          await expect.poll(() => style(bold).color).toBe(hoverForeground);
        }
        button.setAttribute("aria-pressed", "true");
        editor.execute("bold");
        await userEvent.hover(reference);
        await expect
          .poll(() => style(button).backgroundColor)
          .toBe(normalize(tokens["--ck-color-base-selected"]));
        await expect
          .poll(() => style(button).color)
          .toBe(normalize(tokens["--ck-button-default-active-text-color"]));
        await expect
          .poll(() => style(bold).backgroundColor)
          .toBe(style(button).backgroundColor);
        await expect.poll(() => style(bold).color).toBe(style(button).color);
        editor.execute("bold");
        button.removeAttribute("aria-pressed");
        await userEvent.keyboard("{Tab}");
        button.focus();
        const focusShadow = normalize(
          tokens["--ck-focus-shadow"],
          "box-shadow",
        );
        await expect.poll(() => style(button).boxShadow).toBe(focusShadow);
        const outlineWidth = style(button).outlineWidth;
        const outlineOffset = style(button).outlineOffset;
        bold.focus();
        await expect.poll(() => style(bold).boxShadow).toBe(focusShadow);
        expect(style(bold).outlineWidth).toBe(outlineWidth);
        expect(style(bold).outlineOffset).toBe(outlineOffset);

        const dropdown = editor.ui.view.toolbar.element.querySelector(
          ".ck-dropdown > .ck-button",
        );
        dropdown.click();
        const menu = editor.ui.view.toolbar.element.querySelector(
          ".ck-dropdown__panel .ck-list-item-button",
        );
        expect(menu).toBeTruthy();
        menu.focus();
        const stripe = getComputedStyle(menu, "::before");
        expect(stripe.content).toBe('""');
        expect(stripe.width).toBe(`${theme.space.base}px`);
        expect(stripe.borderInlineEndWidth).toBe(theme.borderWidths.sm);
        expect(style(menu).boxShadow).toBe("none");
        expect(style(menu).borderRadius).toBe(theme.borderRadii.sm);
        expect(language === "ar" ? stripe.right : stripe.left).toBe("0px");
        expect(style(menu).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
        await userEvent.keyboard("{Escape}");
      }
    } finally {
      reactRoot.unmount();
    }
  },
);

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
