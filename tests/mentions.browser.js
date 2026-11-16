import { expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { create, fixture, type } from "./helpers/editor";

it("selects mocked mentions, preserves duplicate/reloaded server HTML and clipboard usernames", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify([{ id: 42, name: "Alex Morgan" }])),
    ),
  );
  const { target } = fixture();
  const editor = await create(target);
  await type(editor, "@Alex");
  const overlay = editor.ui.view.body.bodyCollectionContainer;
  await expect
    .poll(() => overlay.querySelector(".hc-mentions__item"))
    .toBeTruthy();
  const item = overlay.querySelector(".hc-mentions__item");
  expect(item.classList.contains("ck-list-item-button")).toBe(true);
  expect(getComputedStyle(item).paddingTop).toBe("8px");
  await userEvent.keyboard("{Enter}");
  await expect
    .poll(() => editor.getData())
    .toContain(
      '<x-zendesk-user data-user-name="Alex Morgan">42</x-zendesk-user>',
    );
  const html =
    '<p><x-zendesk-user data-user-name="Alex">42</x-zendesk-user><x-zendesk-user data-user-name="Alex">42</x-zendesk-user></p>';
  editor.setData(html);
  editor.setData(editor.getData());
  expect(editor.getData()).toBe(html);
  const fragment = editor.model.getSelectedContent(
    editor.model.createSelection(editor.model.document.getRoot(), "in"),
  );
  const clipboard = editor.data.toView(fragment, { isClipboardPipeline: true });
  const clipboardHtml = editor.data.htmlProcessor.toData(clipboard);
  expect(clipboardHtml).toContain('data-mention="Alex"');
  expect(clipboardHtml).not.toContain("data-mention-uid");
});

it("notifies the consumer at the mention limit and suppresses further suggestions", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const { target } = fixture();
  const editor = await create(target);
  const onWarning = vi.fn((event) => event.stop());
  editor.plugins.get("Notification").on("show:warning", onWarning);
  editor.setData(
    `<p>${'<x-zendesk-user data-user-name="Alex">42</x-zendesk-user>'.repeat(15)}</p>`,
  );
  await expect.poll(() => onWarning.mock.calls.length).toBe(1);
  await type(editor, " @Al");
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(fetch).not.toHaveBeenCalled();
});
