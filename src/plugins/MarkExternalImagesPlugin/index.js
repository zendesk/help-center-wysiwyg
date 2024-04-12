/*
  This plugin will add a class to the editor's parent element so that images
  with src-attributes that references external domains can be visually highlighted.
*/
import "./styles.css";

export default function MarkExternalImagesPlugin(editor) {
  editor.sourceElement.parentNode.classList.add(
    "hc-ckeditor--mark-external-images",
  );
}
