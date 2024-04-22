import { translate as t } from "../localization";

class XHRImageUploadAdapter {
  constructor(loader, config) {
    this.loader = loader;
    this.config = config;
  }

  upload() {
    return this.loader.file.then(
      (file) =>
        new Promise((resolve, reject) => {
          this._initRequest();
          this._initListeners(resolve, reject, file);
          this._sendRequest(resolve, reject, file);
        }),
    );
  }

  abort() {
    if (this.xhr) {
      this.xhr.abort();
    }
  }

  _initRequest() {
    const xhr = (this.xhr = new XMLHttpRequest());
    xhr.withCredentials = true;

    xhr.open("POST", this.config.endpoint, true);
    xhr.responseType = "json";
  }

  _initListeners(resolve, reject) {
    const xhr = this.xhr;
    const loader = this.loader;
    const genericErrorText = t(
      "help-center-wysiwyg.image_upload_generic_error",
      { max_size: 50 },
    );

    xhr.addEventListener("error", () => reject(genericErrorText));
    xhr.addEventListener("abort", () => reject());
    xhr.addEventListener("load", () => {
      const response = xhr.response;

      if (!response || response.error || response[0]?.error) {
        return reject(
          response && response.error
            ? response.error.message
            : genericErrorText,
        );
      }

      resolve({
        urls: {
          default: this.config.urlFromResponse(response),
        },
        token: response.id,
      });
    });

    if (xhr.upload) {
      xhr.upload.addEventListener("progress", (evt) => {
        if (!evt.lengthComputable) return;

        loader.uploadTotal = evt.total;
        loader.uploaded = evt.loaded;
      });
    }
  }

  async _sendRequest(resolve, reject, file) {
    const data = new FormData();
    const response = await fetch("/api/v2/help_center/sessions.json");

    if (response.ok) {
      const {
        current_session: { csrf_token },
      } = await response.json();

      data.append("authenticity_token", csrf_token);
      data.append("inline", true);
      data.append("file", file);

      this.xhr.send(data);
    } else {
      reject();
    }
  }
}

export default function XHRImageUploadPlugin(editor) {
  if (typeof editor.config.get("imageUpload.endpoint") !== "string")
    throw new Error(
      "XHRImageUploadAdapter: config.imageUpload.endpoint must be defined",
    );

  if (typeof editor.config.get("imageUpload.urlFromResponse") !== "function")
    throw new Error(
      "XHRImageUploadAdapter: config.imageUpload.urlFromResponse must be defined",
    );

  editor.plugins.get("FileRepository").createUploadAdapter = (loader) =>
    new XHRImageUploadAdapter(loader, editor.config.get("imageUpload"));
}
