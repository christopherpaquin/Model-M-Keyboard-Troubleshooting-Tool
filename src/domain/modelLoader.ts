import YAML from "yaml";
import type {
  KeyboardKey,
  KeyboardModelManifest,
  KeyTraceMapEntry,
  KeyboardTrace,
  LoadedKeyboardModel,
  ModelsRegistry,
  RibbonContact,
  TracePath,
} from "./types";
import { validateModel } from "./validation";

const MODELS_BASE = "/models";

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`Failed to load ${url}: ${r.status} ${r.statusText}`);
  }
  return r.text();
}

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  throw new Error("Expected object");
}

function readKeys(v: unknown): KeyboardKey[] {
  const o = asRecord(v);
  const list = o.keys;
  if (!Array.isArray(list)) throw new Error("keys.yaml: expected 'keys' array");
  return list as KeyboardKey[];
}

function readTraces(v: unknown): KeyboardTrace[] {
  const o = asRecord(v);
  const list = o.traces;
  if (!Array.isArray(list)) throw new Error("traces.yaml: expected 'traces' array");
  return list as KeyboardTrace[];
}

function readPaths(v: unknown): TracePath[] {
  const o = asRecord(v);
  const list = o.tracePaths;
  if (!Array.isArray(list)) throw new Error("trace_paths.yaml: expected 'tracePaths' array");
  return list as TracePath[];
}

function readRibbon(v: unknown): RibbonContact[] {
  const o = asRecord(v);
  const list = o.ribbonContacts;
  if (!Array.isArray(list)) {
    throw new Error("ribbon_contacts.yaml: expected 'ribbonContacts' array");
  }
  return list as RibbonContact[];
}

function readKeyMap(v: unknown): KeyTraceMapEntry[] {
  const o = asRecord(v);
  const list = o.keyTraceMap;
  if (!Array.isArray(list)) {
    throw new Error("key_trace_map.yaml: expected 'keyTraceMap' array");
  }
  return list as KeyTraceMapEntry[];
}

export async function loadRegistry(): Promise<ModelsRegistry> {
  const text = await fetchText(`${MODELS_BASE}/registry.yaml`);
  return YAML.parse(text) as ModelsRegistry;
}

export async function loadModelPackage(
  packagePath: string,
): Promise<{ model: LoadedKeyboardModel; error?: string }> {
  const base = `${MODELS_BASE}/${packagePath}`;
  try {
    const manifestText = await fetchText(`${base}/manifest.yaml`);
    const manifest = YAML.parse(manifestText) as KeyboardModelManifest;
    if (!manifest.files) {
      throw new Error("manifest: missing 'files' block");
    }
    const keysT = await fetchText(`${base}/${manifest.files.keys}`);
    const trT = await fetchText(`${base}/${manifest.files.traces}`);
    const pathsT = await fetchText(`${base}/${manifest.files.tracePaths}`);
    const ribT = await fetchText(`${base}/${manifest.files.ribbonContacts}`);
    const mapT = await fetchText(`${base}/${manifest.files.keyTraceMap}`);

    const model: LoadedKeyboardModel = {
      manifest,
      keys: readKeys(YAML.parse(keysT)),
      traces: readTraces(YAML.parse(trT)),
      tracePaths: readPaths(YAML.parse(pathsT)),
      ribbonContacts: readRibbon(YAML.parse(ribT)),
      keyTraceMap: readKeyMap(YAML.parse(mapT)),
    };

    const v = validateModel(model);
    if (!v.ok) {
      return {
        model,
        error: v.issues
          .filter((i) => i.level === "error")
          .map((i) => i.message)
          .join("\n"),
      };
    }
    return { model };
  } catch (e) {
    return {
      model: {
        manifest: {
          modelId: "error",
          displayName: "Load error",
          family: "—",
          layoutName: "—",
          description: String(e),
          schemaVersion: "—",
          modelVersion: "—",
          files: { keys: "", traces: "", tracePaths: "", ribbonContacts: "", keyTraceMap: "" },
        },
        keys: [],
        traces: [],
        tracePaths: [],
        ribbonContacts: [],
        keyTraceMap: [],
      },
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export { validateModel };

export function getPackagePathForId(
  registry: ModelsRegistry,
  modelId: string,
): string | undefined {
  return registry.models.find((m) => m.modelId === modelId)?.packagePath;
}
