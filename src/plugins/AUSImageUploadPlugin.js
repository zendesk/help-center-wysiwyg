/*
  Image upload plugin for CKEditor that uploads images via the
  Asset Upload Service (AUS)
*/
import { translate as t } from "../localization";

class AUSImageUploadAdapter {
  constructor(loader, editor) {
    this.loader = loader;
    this.editor = editor;
  }

  upload() {
    return this.loader.file.then((file) => this._upload(file));
  }

  abort() {
    if (this.xhr) {
      this.xhr.abort();
    }
  }

  async _upload(file) {
    const brandId = this.editor.config.get("imageUpload.brandId");

    const {
      user: { authenticity_token },
    } = await fetch("/api/v2/users/me.json").then((r) => r.json());

    const { upload, errors: uploadErrors } = await fetch(
      "/api/v2/guide/user_images/uploads",
      {
        method: "POST",
        credentials: "same-origin",
        headers: { "x-csrf-token": authenticity_token },
        body: JSON.stringify({
          content_type: file.type,
          file_size: file.size,
        }),
      },
    ).then((r) => r.json());

    if (uploadErrors) {
      throw new Error(
        t("help-center-wysiwyg.image_upload_generic_error", {
          max_size: 2,
        }),
      );
    }

    await fetch(upload.url, {
      method: "PUT",
      headers: upload.headers,
      body: file,
    });

    const {
      errors,
      user_image: { path: imageURL },
    } = await fetch("/api/v2/guide/user_images", {
      method: "POST",
      credentials: "same-origin",
      headers: { "x-csrf-token": authenticity_token },
      body: JSON.stringify({
        token: upload.token,
        brand_id: brandId.toString(),
      }),
    }).then((r) => r.json());

    if (errors) {
      throw new Error(
        t("help-center-wysiwyg.image_upload_generic_error", {
          max_size: 2,
        }),
      );
    }
    return { default: imageURL };
  }
}

export default function AUSImageUploadPlugin(editor) {
  if (typeof editor.config.get("imageUpload.brandId") !== "number")
    throw new Error(
      "AUSImageUploadPlugin: config.imageUpload.brandId must be defined",
    );

  editor.plugins.get("FileRepository").createUploadAdapter = (loader) =>
    new AUSImageUploadAdapter(loader, editor);
}
