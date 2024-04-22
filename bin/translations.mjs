import { writeFileSync } from "node:fs";

const baseUrl = `https://static.zdassets.com/translations`;
const response = await fetch(`${baseUrl}/help-center-wysiwyg/manifest.json`);
const { json } = await response.json();

for (const { name, path } of json) {
  const response = await fetch(`${baseUrl}${path}`);
  const data = await response.json();
  writeFileSync(
    `translations/${name.toLocaleLowerCase()}.json`,
    JSON.stringify(data, null, 2) + "\n",
    "utf-8",
  );
}
