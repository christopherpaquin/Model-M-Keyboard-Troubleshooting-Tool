/**
 * Merges into public/models/registry.yaml so multiple generators can co-exist.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const REGISTRY_PATH = path.join(root, "public", "models", "registry.yaml");

export function upsertModelRegistryEntry(modelId, packagePath) {
  let data = { models: [] };
  if (fs.existsSync(REGISTRY_PATH)) {
    const t = fs.readFileSync(REGISTRY_PATH, "utf8");
    data = YAML.parse(t) ?? { models: [] };
  }
  if (!Array.isArray(data.models)) data.models = [];
  const i = data.models.findIndex((m) => m.modelId === modelId);
  const entry = { modelId, packagePath };
  if (i >= 0) {
    data.models[i] = entry;
  } else {
    data.models.push(entry);
  }
  data.models.sort((a, b) => a.modelId.localeCompare(b.modelId));
  fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, String(new YAML.Document(data)));
}
