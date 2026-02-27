import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const versionPath = resolve(root, "VERSION");
const version = readFileSync(versionPath, "utf8").trim();

if (!/^\d+\.\d+\.\d+([-.][0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`Invalid VERSION value: "${version}"`);
}

function updateJsonFile(path, mutate) {
  const abs = resolve(root, path);
  const data = JSON.parse(readFileSync(abs, "utf8"));
  mutate(data);
  writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function updateCargoPackageVersion(path) {
  const abs = resolve(root, path);
  const original = readFileSync(abs, "utf8");
  const lines = original.split("\n");
  let section = "";
  let replaced = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sectionMatch = line.match(/^\s*\[(.+)\]\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      continue;
    }
    if (section === "package" && /^\s*version\s*=/.test(line)) {
      lines[i] = `version = "${version}"`;
      replaced = true;
      break;
    }
  }

  if (!replaced) {
    throw new Error(`Could not find [package].version in ${path}`);
  }

  writeFileSync(abs, `${lines.join("\n")}\n`, "utf8");
}

updateJsonFile("package.json", (data) => {
  data.version = version;
});

updateJsonFile("src-tauri/tauri.conf.json", (data) => {
  data.version = version;
});

updateCargoPackageVersion("src-tauri/Cargo.toml");

console.log(`Synced version ${version} to package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml`);
