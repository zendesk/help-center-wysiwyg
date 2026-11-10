import { expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import React from "react";
import { createRoot } from "react-dom/client";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  api,
  containers,
  create,
  editors,
  fixture,
  openLink,
  options,
  type,
} from "./helpers/editor";

// React must not depend on a previous standalone creation call.
it("initializes, localizes, emits changes and unmounts through React adapter 12 alone", async () => {
  const { container } = fixture();
  const reactRoot = createRoot(container);
  const onChange = vi.fn();
  let editor;
  try {
    editor = await new Promise((resolve, reject) => {
      reactRoot.render(
        React.createElement(CKEditor, {
          editor: api.default,
          config: {
            ...api.getEditorConfig({ ...options, locale: "DE" }),
            licenseKey: "GPL",
          },
          data: "<p>Initial content</p>",
          onReady: resolve,
          onError: reject,
          onChange,
        }),
      );
    });
    expect(editor.ui.view.toolbar.element.textContent).toContain("Absatz");
    expect(editor.getData()).toBe("<p>Initial content</p>");
    editor.setData("");
    expect(getComputedStyle(editor.ui.getEditableElement()).minHeight).toBe(
      "210px",
    );
    await type(editor, "Hallo");
    expect(editor.getData()).toBe("<p>Hallo</p>");
    expect(onChange).toHaveBeenCalled();
  } finally {
    reactRoot.unmount();
  }
  await expect.poll(() => editor.state).toBe("destroyed");
});

it("works with the vanilla helper, including initial content, labels, input events and form submission", async () => {
  const { target, form, submit } = fixture(true);
  target.value = "<p>Initial content</p>";
  const onInput = vi.fn();
  target.addEventListener("input", onInput);
  // The release build has no test license; keep that fixture concern outside
  // the public two-argument helper while exercising real shared initialization.
  const originalCreate = api.default.create.bind(api.default);
  vi.spyOn(api.default, "create").mockImplementation((config) =>
    originalCreate({ ...config, licenseKey: "GPL" }),
  );
  const editor = await api.createEditor(target, {
    ...options,
    editorType: "supportRequests",
    baseLocale: "DE",
    locale: "DE",
  });
  editors.push(editor);
  expect(editor.getData()).toBe("<p>Initial content</p>");
  expect(editor.ui.view.toolbar.element.textContent).toContain("Absatz");
  expect(editor.locale.uiLanguage).toBe("de");
  expect(editor.locale.contentLanguage).toBe("de");
  expect(editor.ui.getEditableElement().getAttribute("aria-label")).toContain(
    "Message details",
  );
  expect(getComputedStyle(editor.ui.getEditableElement()).minHeight).toBe(
    "210px",
  );
  await type(editor, "Hallo");
  expect(onInput).toHaveBeenCalled();
  expect(target.value).toBe(editor.getData());
  form.dispatchEvent(new Event("submit", { cancelable: true }));
  await expect.poll(() => submit.mock.calls.length).toBe(1);
});

it("falls back to the supplied base without changing RTL content language", async () => {
  const { target } = fixture();
  const editor = await create(
    target,
    {},
    { locale: "missing", baseLocale: "AR" },
  );
  expect(editor.locale.contentLanguage).toBe("ar");
  expect(editor.locale.contentLanguageDirection).toBe("rtl");
  expect(editor.ui.view.toolbar.element.textContent).not.toContain("Paragraph");
});

it("keeps RTL editing with bundled English when both translation candidates are missing", async () => {
  const { target } = fixture();
  // CKEditor recognizes this exact RTL code, but the package has no bundle.
  const editor = await create(
    target,
    {},
    { locale: "missing", baseLocale: "ug" },
  );
  expect(editor.ui.view.toolbar.element.textContent).toContain("Paragraph");
  expect(editor.locale.contentLanguage).toBe("ug");
  expect(editor.locale.contentLanguageDirection).toBe("rtl");
  expect(editor.ui.getEditableElement().getAttribute("dir")).toBe("rtl");
});

it("edits, labels, links and submits inside a component-owned closed root", async () => {
  const { target, form, submit, container } = fixture(true);
  expect(container.shadowRoot).toBeNull();
  const onInput = vi.fn();
  target.addEventListener("input", onInput);
  const editor = await create(target, {}, { editorType: "supportRequests" });
  expect(editor.ui.getEditableElement().getAttribute("aria-label")).toContain(
    "Message details",
  );
  expect(editor.ui.view.toolbar.element.getAttribute("aria-label")).toContain(
    "Message details",
  );
  await type(editor, "Hello ");
  const link = await openLink(editor);
  const url = link.querySelector("input[inputmode='url']");
  url.focus();
  await userEvent.keyboard("https://example.com");
  link.querySelector("button[type='submit']").click();
  await expect
    .poll(() => editor.getData())
    .toContain('href="https://example.com"');
  expect(target.value).toBe(editor.getData());
  expect(onInput).toHaveBeenCalled();
  form.requestSubmit();
  await expect.poll(() => submit.mock.calls.length).toBeGreaterThan(0);
  expect(new FormData(form).get("message")).toBe(editor.getData());
});

it("styles the editor and link UI and follows only the host's resolved scheme", async () => {
  const { target, root } = fixture(true);
  const editor = await create(target);
  const link = await openLink(editor);
  const editable = editor.ui.getEditableElement();
  expect(editable.classList.contains("hc-ckeditor--mark-external-images")).toBe(
    true,
  );
  expect(getComputedStyle(editable).minHeight).toBe("210px");
  const linkSurface = link.closest(".ck-balloon-panel");
  expect(getComputedStyle(link.querySelector("input")).borderTopStyle).toBe(
    "solid",
  );
  const staticStyle = root.querySelector("[data-hc-editor-styles]");
  const staticCss = staticStyle.textContent;
  const lightLinkBackground = getComputedStyle(linkSurface).backgroundColor;
  expect(lightLinkBackground).not.toBe("rgba(0, 0, 0, 0)");
  document.documentElement.setAttribute("data-hc-color-scheme", "dark");
  await expect
    .poll(() => getComputedStyle(editable).backgroundColor)
    .toBe("rgb(25, 25, 26)");
  await expect
    .poll(() => getComputedStyle(linkSurface).backgroundColor)
    .not.toBe(lightLinkBackground);
  document.documentElement.setAttribute("data-hc-color-scheme", "unknown");
  await expect
    .poll(() => getComputedStyle(editable).backgroundColor)
    .toBe("rgb(255, 255, 255)");
  await expect
    .poll(() => getComputedStyle(linkSurface).backgroundColor)
    .toBe(lightLinkBackground);
  expect(root.querySelector("[data-hc-editor-styles]")).toBe(staticStyle);
  expect(staticStyle.textContent).toBe(staticCss);
});

it(
  "preserves Garden content and toolbar focus rings and error borders through keyboard navigation",
  async () => {
    document.documentElement.style.setProperty("--hc-primary-color", "#7950b8");
    const { target, root } = fixture();
    const editor = await create(target);
    const editable = editor.ui.getEditableElement();
    // Normalize Garden's token through the browser, rather than hardcoding a
    // palette or passing just because the intended variable was installed.
    const expectedShadow = (variable) => {
      const probe = document.createElement("span");
      probe.style.boxShadow =
        getComputedStyle(editable).getPropertyValue(variable);
      root.append(probe);
      const shadow = getComputedStyle(probe).boxShadow;
      probe.remove();
      return shadow;
    };

    editor.editing.view.focus();
    await expect
      .poll(() => editable.classList.contains("ck-focused"))
      .toBe(true);
    const focusShadow = expectedShadow("--ck-focus-shadow");
    expect(focusShadow).not.toBe("none");
    expect(getComputedStyle(editable).boxShadow).toBe(focusShadow);
    expect(getComputedStyle(editable).outlineStyle).toBe("solid");
    expect(getComputedStyle(editable).outlineWidth).toBe("2px");
    expect(getComputedStyle(editable).outlineOffset).toBe("1px");

    // The toolbar itself is a separate Tab stop; its ring must not be
    // confused with the content ring or a focused individual toolbar button.
    const toolbar = editor.ui.view.toolbar.element;
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(toolbar.matches(":focus-visible")).toBe(true);
    expect(getComputedStyle(toolbar).boxShadow).toBe(focusShadow);
    expect(getComputedStyle(toolbar).outlineStyle).toBe("solid");
    // CKEditor keeps .ck-focused while focus is elsewhere in its UI, so
    // assert the actual focused element rather than that editor-wide state.
    expect(editable.matches(":focus")).toBe(false);
    await userEvent.keyboard("{Tab}");
    await expect
      .poll(() => editable.classList.contains("ck-focused"))
      .toBe(true);
    expect(getComputedStyle(toolbar).boxShadow).not.toBe(focusShadow);
    expect(getComputedStyle(editable).boxShadow).toBe(focusShadow);

    const probe = document.createElement("span");
    probe.style.borderColor = "var(--ck-color-feedback-error)";
    root.append(probe);
    const errorBorder = getComputedStyle(probe).borderTopColor;
    probe.remove();
    const expectErrorBorder = () => {
      const style = getComputedStyle(editable);
      for (const side of ["Top", "Right", "Bottom", "Left"])
        expect(style[`border${side}Color`]).toBe(errorBorder);
    };

    editor.editing.view.change((writer) => {
      writer.setAttribute(
        "aria-invalid",
        "true",
        editor.editing.view.document.getRoot(),
      );
    });
    const errorShadow = expectedShadow("--ck-focus-error-shadow");
    const expectToolbarShadow = async (shadow) => {
      await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
      expect(toolbar.matches(":focus-visible")).toBe(true);
      expect(getComputedStyle(toolbar).boxShadow).toBe(shadow);
      await userEvent.keyboard("{Tab}");
      expect(editable.matches(":focus")).toBe(true);
    };
    expect(errorShadow).not.toBe(focusShadow);
    expect(getComputedStyle(editable).boxShadow).toBe(errorShadow);
    expect(getComputedStyle(editable).outlineStyle).toBe("solid");
    expectErrorBorder();
    editable.blur();
    await expect
      .poll(() => editable.classList.contains("ck-focused"))
      .toBe(false);
    expect(editable.getAttribute("aria-invalid")).toBe("true");
    expectErrorBorder();
    editor.editing.view.focus();
    expectErrorBorder();
    await expectToolbarShadow(errorShadow);

    editor.editing.view.change((writer) => {
      writer.removeAttribute(
        "aria-invalid",
        editor.editing.view.document.getRoot(),
      );
    });
    expect(getComputedStyle(editable).boxShadow).toBe(focusShadow);
    await expectToolbarShadow(focusShadow);
    editable.blur();
    await expect
      .poll(() => editable.classList.contains("ck-focused"))
      .toBe(false);
    expect(getComputedStyle(editable).boxShadow).not.toBe(focusShadow);
    expect(getComputedStyle(editable).borderTopColor).not.toBe(errorBorder);

    // Preserve validation via the original textarea too, including validation
    // applied after initialization (the ARIA plugin only copies initial state).
    target.setAttribute("aria-invalid", "true");
    expectErrorBorder();
    expect(
      getComputedStyle(
        editor.ui.view.element.querySelector(".ck-sticky-panel__content"),
      ).borderTopColor,
    ).toBe(errorBorder);
    editor.editing.view.focus();
    await expect
      .poll(() => editable.classList.contains("ck-focused"))
      .toBe(true);
    expectErrorBorder();
    expect(getComputedStyle(editable).boxShadow).toBe(errorShadow);
    await expectToolbarShadow(errorShadow);
    target.removeAttribute("aria-invalid");
    expect(getComputedStyle(editable).boxShadow).toBe(focusShadow);
    await expectToolbarShadow(focusShadow);
    expect(getComputedStyle(editable).borderTopColor).not.toBe(errorBorder);
  },
);

it("shares static styles and keeps caller-owned overlay styles current after one editor is destroyed", async () => {
  const { target, root } = fixture(true);
  const overlayHost = document.createElement("div");
  document.body.append(overlayHost);
  containers.push(overlayHost);
  const overlay = overlayHost.attachShadow({ mode: "closed" });
  const first = await create(target, { ui: { overlayContainer: overlay } });
  const secondTarget = document.createElement("div");
  root.append(secondTarget);
  // Older observers must use the same current host settings as new editors.
  document.documentElement.style.setProperty("--hc-primary-color", "#7950b8");
  const second = await create(secondTarget, {
    ui: { overlayContainer: overlay },
  });
  expect(root.querySelectorAll("[data-hc-editor-styles]")).toHaveLength(1);
  expect(overlay.querySelectorAll("[data-hc-editor-styles]")).toHaveLength(1);
  expect(root.querySelectorAll("[data-hc-editor-theme]")).toHaveLength(1);
  expect(overlay.querySelectorAll("[data-hc-editor-theme]")).toHaveLength(1);
  const theme = root.querySelector("[data-hc-editor-theme]");
  const overlayTheme = overlay.querySelector("[data-hc-editor-theme]");
  const lightTheme = theme.textContent;
  const mutations = [];
  const observer = new MutationObserver((records) =>
    mutations.push(...records),
  );
  observer.observe(theme, { childList: true });
  try {
    // Both editors observe the host, but identical CSS is written only once.
    document.documentElement.setAttribute("data-hc-color-scheme", "dark");
    await expect
      .poll(() =>
        getComputedStyle(overlayHost)
          .getPropertyValue("--ck-color-base-background")
          .trim(),
      )
      .toBe("#19191a");
    expect(theme.textContent).toBe(overlayTheme.textContent);
    expect(mutations).toHaveLength(1);

    await first.destroy();
    editors.splice(editors.indexOf(first), 1);
    const link = await openLink(second);
    expect(overlay.contains(link)).toBe(true);
    document.documentElement.setAttribute("data-hc-color-scheme", "light");
    await expect.poll(() => overlayTheme.textContent).toBe(lightTheme);
    expect(theme.textContent).toBe(lightTheme);
    expect(mutations).toHaveLength(2);
  } finally {
    observer.disconnect();
  }
});

it("submits comments HTML and hidden fields and destroys without plugin recursion", async () => {
  const { target, form, submit } = fixture();
  const editor = await create(target, {}, { editorType: "comments" });
  await type(editor, "Comment");
  form.requestSubmit();
  expect(submit).toHaveBeenCalled();
  expect(new FormData(form).get("content_type")).toBe("text/html");
  expect(new FormData(form).get("message")).toBe("<p>Comment</p>");
  await editor.destroy();
  editors.splice(editors.indexOf(editor), 1);
  expect(editor.state).toBe("destroyed");
});

it.each(["Custom message", ""])(
  "preserves explicit root label %j and caller configuration",
  async (label) => {
    const { target } = fixture();
    const root = { label, initialData: "<p>Existing content</p>" };
    const editor = await create(target, { root });
    const editableLabel = editor.ui
      .getEditableElement()
      .getAttribute("aria-label");
    expect(editableLabel).not.toContain("Message details");
    if (label) expect(editableLabel).toContain(label);
    expect(editor.getData()).toBe("<p>Existing content</p>");
    expect(root).toEqual({ label, initialData: "<p>Existing content</p>" });
  },
);

it("preserves roots.main configuration without injecting a conflicting root shorthand", async () => {
  const { target } = fixture();
  const editor = await create(target, {
    roots: { main: { label: "Configured root" } },
  });
  expect(editor.ui.getEditableElement().getAttribute("aria-label")).toContain(
    "Configured root",
  );
});

it.each([
  {
    product: { baseLocale: "AR", locale: "DE" },
    expected: { baseLocale: "ar", locale: "de", language: "ar" },
  },
  {
    product: { baseLocale: "DE", locale: "DE" },
    expected: { baseLocale: "de", locale: "de", language: "de" },
  },
])(
  "resolves locale settings in the preset: $expected",
  ({ product, expected }) => {
    expect(api.getEditorConfig({ ...options, ...product })).toMatchObject(
      expected,
    );
  },
);

it.each(["locale", "baseLocale"])("requires an explicit non-empty %s", (name) => {
  for (const value of [undefined, null, "", " ", 42]) {
    expect(() => api.getEditorConfig({ ...options, [name]: value })).toThrow(
      `getEditorConfig: ${name} must be a non-empty string`,
    );
  }
});

it("retains marked styles but disconnects the editor's observer on destruction", async () => {
  const { target, root } = fixture(true);
  const first = await create(target);
  const staticStyle = root.querySelector("[data-hc-editor-styles]");
  const themeStyle = root.querySelector("[data-hc-editor-theme]");
  const originalTheme = themeStyle.textContent;
  const originalBrand = getComputedStyle(
    first.ui.getEditableElement(),
  ).getPropertyValue("--ck-color-link-default");
  await first.destroy();
  editors.splice(editors.indexOf(first), 1);

  document.documentElement.setAttribute("data-hc-color-scheme", "dark");
  document.documentElement.style.setProperty("--hc-primary-color", "#7950b8");
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(themeStyle.textContent).toBe(originalTheme);

  const second = await create(target);
  expect(root.querySelector("[data-hc-editor-styles]")).toBe(staticStyle);
  expect(root.querySelector("[data-hc-editor-theme]")).toBe(themeStyle);
  const style = getComputedStyle(second.ui.getEditableElement());
  expect(style.backgroundColor).toBe("rgb(25, 25, 26)");
  expect(style.getPropertyValue("--ck-color-link-default")).not.toBe(
    originalBrand,
  );
});

it("disconnects theme observation after failed initialization and reuses styles on retry", async () => {
  const { target, root } = fixture(true);
  await expect(
    api.default.create({
      ...api.getEditorConfig(options),
      attachTo: target,
      licenseKey: "GPL",
      extraPlugins: [
        function FailingPlugin() {
          throw new Error("controlled creation failure");
        },
      ],
    }),
  ).rejects.toThrow("controlled creation failure");
  const theme = root.querySelector("[data-hc-editor-theme]");
  const before = theme.textContent;
  document.documentElement.setAttribute("data-hc-color-scheme", "dark");
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(theme.textContent).toBe(before);

  const editor = await create(target);
  expect(root.querySelectorAll("[data-hc-editor-styles]")).toHaveLength(1);
  expect(root.querySelectorAll("[data-hc-editor-theme]")).toHaveLength(1);
  expect(root.querySelector("[data-hc-editor-theme]")).toBe(theme);
  expect(theme.textContent).not.toBe(before);
  expect(getComputedStyle(editor.ui.getEditableElement()).minHeight).toBe(
    "210px",
  );
});
