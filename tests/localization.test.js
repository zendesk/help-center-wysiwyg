import { expect, it, vi } from "vitest";
import { localize, translate } from "../src/localization";
import { translations as english } from "../translations/en-us.json";
import { translations as german } from "../translations/de.json";

vi.mock("../translations/fr-ca.json", () => {
  throw new Error("Translation bundle download failed");
});

it("prefers the requested locale over the supplied base", async () => {
  const dictionary = await localize("de", "en-us");
  expect(dictionary.Bold).toBe(german["help-center-wysiwyg.bold"]);
  expect(translate("help-center-wysiwyg.bold")).toBe(
    german["help-center-wysiwyg.bold"],
  );
});

it("loads translations when the resolved locale and base locale are identical", async () => {
  expect((await localize("de", "de")).Bold).toBe(
    german["help-center-wysiwyg.bold"],
  );
});

it.each(["missing-region", "fr-ca"])(
  "uses the supplied base when %s is missing or fails to download",
  async (locale) => {
    expect((await localize(locale, "de")).Bold).toBe(
      german["help-center-wysiwyg.bold"],
    );
  },
);

it("keeps bundled English when both candidates fail, without deriving a base", async () => {
  // A derived `de` candidate would produce German instead of English.
  const dictionary = await localize("de-missing", "also-missing");
  expect(dictionary.Bold).toBe(english["help-center-wysiwyg.bold"]);
  expect(translate("help-center-wysiwyg.toolbar_label")).toBe(
    english["help-center-wysiwyg.toolbar_label"],
  );
  expect((await localize("missing", "missing")).Bold).toBe(dictionary.Bold);
});

it("preserves the existing custom-plugin translation and interpolation helper", async () => {
  await localize("en-us", "en-us");
  expect(
    translate("help-center-wysiwyg.toolbar_label", { label: "Message" }),
  ).toBe("Message text formatting");
  expect(
    translate("help-center-wysiwyg.image_upload_generic_error", {
      max_size: 50,
    }),
  ).toContain("50 MB");
  expect(translate("unknown-key")).toBeUndefined();
});
