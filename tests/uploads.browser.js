import { expect, it, vi } from "vitest";
import { create, editors, fixture, type } from "./helpers/editor";

const imageUrl = "/tests/fixtures/pixel.png";
async function imageFile() {
  return new File(
    [await (await window.fetch(imageUrl)).arrayBuffer()],
    "pixel.png",
    { type: "image/png" },
  );
}

function mockRequestUpload() {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({ current_session: { csrf_token: "csrf" } }),
        ),
    ),
  );
  class Request extends EventTarget {
    upload = new EventTarget();
    open = vi.fn();
    send = vi.fn(() => {
      this.response = { id: "attachment-token", url: imageUrl };
      this.dispatchEvent(new Event("load"));
    });
    abort() {}
  }
  vi.stubGlobal("XMLHttpRequest", Request);
}

it("removes unused uploaded attachments from a shadow-local form, without touching another form", async () => {
  const file = await imageFile();
  const { target, form, submit } = fixture(true);
  const other = fixture();
  const unrelated = document.createElement("input");
  unrelated.name = "request[attachments][]";
  unrelated.value = JSON.stringify({ inline: true, _src: "/other.png" });
  other.form.append(unrelated);
  mockRequestUpload();
  const editor = await create(target, {}, { editorType: "supportRequests" });
  editor.execute("uploadImage", { file });
  await expect.poll(() => editor.getData()).toContain("pixel.png");
  await expect
    .poll(() => form.querySelector('input[name="request[attachments][]"]'))
    .toBeTruthy();
  form.requestSubmit();
  await expect.poll(() => submit.mock.calls.length).toBeGreaterThan(0);
  expect(JSON.parse(new FormData(form).get("request[attachments][]")).id).toBe(
    "attachment-token",
  );
  editor.setData("<p>Image removed</p>");
  form.requestSubmit();
  expect(new FormData(form).getAll("request[attachments][]")).toEqual([]);
  expect(other.form.contains(unrelated)).toBe(true);
});

it("preserves server-rendered attachment handling in a shadow root and cleans up on destroy", async () => {
  const { target, form, submit } = fixture(true);
  const editor = await create(target, {}, { editorType: "supportRequests" });
  editor.setData(`<p><img src="${imageUrl}" alt="Image"></p>`);
  for (const attachment of [
    { id: "existing", inline: true, _src: imageUrl },
    { id: "unused", inline: true, _src: `${imageUrl}?unused` },
    { id: "download", inline: false },
  ]) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "request[attachments][]";
    input.value = JSON.stringify(attachment);
    form.append(input);
  }
  const submitAndRead = async () => {
    submit.mockClear();
    form.requestSubmit();
    // Flush the deferred native submit.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(submit).toHaveBeenCalledTimes(1);
    return new FormData(form)
      .getAll("request[attachments][]")
      .map((value) => JSON.parse(value).id);
  };
  expect(await submitAndRead()).toEqual(["existing", "download"]);
  editor.setData("<p>Image removed</p>");
  expect(await submitAndRead()).toEqual(["download"]);
  await editor.destroy();
  editors.splice(editors.indexOf(editor), 1);
  submit.mockClear();
  const event = new Event("submit", { cancelable: true });
  form.dispatchEvent(event);
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(event.defaultPrevented).toBe(false);
  expect(submit).not.toHaveBeenCalled();
});

it("preserves attachments across editors sharing a closed-root form and submits only once", async () => {
  const { target, form, submit } = fixture(true);
  const secondTarget = document.createElement("textarea");
  secondTarget.name = "details";
  form.append(secondTarget);
  const first = await create(target, {}, { editorType: "supportRequests" });
  const second = await create(
    secondTarget,
    {},
    { editorType: "supportRequests" },
  );
  first.setData(`<p><img src="${imageUrl}?first" alt="First"></p>`);
  second.setData(`<p><img src="${imageUrl}?second" alt="Second"></p>`);
  for (const attachment of [
    { id: "first", inline: true, _src: `${imageUrl}?first` },
    { id: "second", inline: true, _src: `${imageUrl}?second` },
    { id: "unused", inline: true, _src: `${imageUrl}?unused` },
    { id: "download", inline: false },
  ]) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "request[attachments][]";
    input.value = JSON.stringify(attachment);
    form.append(input);
  }
  const submitAndRead = async () => {
    submit.mockClear();
    form.requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(new FormData(form).get("message")).toBe(target.value);
    expect(new FormData(form).get("details")).toBe(secondTarget.value);
    return new FormData(form)
      .getAll("request[attachments][]")
      .map((value) => JSON.parse(value).id);
  };
  expect(await submitAndRead()).toEqual(["first", "second", "download"]);
  first.setData("<p>First image removed</p>");
  expect(await submitAndRead()).toEqual(["second", "download"]);
  await first.destroy();
  editors.splice(editors.indexOf(first), 1);
  expect(await submitAndRead()).toEqual(["second", "download"]);
  await second.destroy();
  editors.splice(editors.indexOf(second), 1);
  submit.mockClear();
  const event = new Event("submit", { cancelable: true });
  form.dispatchEvent(event);
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(event.defaultPrevented).toBe(false);
  expect(submit).not.toHaveBeenCalled();
});

it("inserts AUS uploads, marks editable external images and forwards upload failures to notifications", async () => {
  const file = await imageFile();
  let fail = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      if (url === "/api/v2/users/me.json")
        return Response.json({ user: { authenticity_token: "csrf" } });
      if (url === "/api/v2/guide/user_images/uploads")
        return Response.json(
          fail
            ? { errors: ["failed"] }
            : { upload: { url: "/upload", headers: {}, token: "token" } },
        );
      if (url === "/upload") return new Response();
      if (url === "/api/v2/guide/user_images")
        return Response.json({ user_image: { path: imageUrl } });
      throw new Error(`Unexpected API: ${url}`);
    }),
  );
  const { target } = fixture();
  const editor = await create(target);
  expect(
    editor.ui
      .getEditableElement()
      .classList.contains("hc-ckeditor--mark-external-images"),
  ).toBe(true);
  editor.execute("uploadImage", { file });
  await expect.poll(() => editor.getData()).toContain("pixel.png");
  const warning = vi.fn((event) => event.stop());
  editor.plugins.get("Notification").on("show:warning", warning);
  fail = true;
  editor.execute("uploadImage", { file });
  await expect.poll(() => warning.mock.calls.length).toBeGreaterThan(0);
});

it("keeps anonymous support requests usable without image upload", async () => {
  const { target } = fixture();
  const editor = await create(
    target,
    {},
    { editorType: "supportRequests", userRole: "anonymous" },
  );
  await type(editor, "Anonymous request");
  expect(target.value).toBe("<p>Anonymous request</p>");
  expect(
    editor.ui.view.toolbar.element.querySelector(
      "button[data-cke-tooltip-text='Insert image']",
    ),
  ).toBeNull();
});
