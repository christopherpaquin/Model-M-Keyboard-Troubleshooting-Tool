import type {
  KeyTraceMapEntry,
  KeyboardKey,
  KeyboardTrace,
  LoadedKeyboardModel,
  ModelValidationIssue,
  ModelValidationReport,
  RibbonContact,
  TracePath,
} from "./types";

function push(
  issues: ModelValidationIssue[],
  level: ModelValidationIssue["level"],
  code: string,
  message: string,
  detail?: string,
) {
  issues.push({ level, code, message, detail });
}

export function validateModel(model: LoadedKeyboardModel): ModelValidationReport {
  const issues: ModelValidationIssue[] = [];
  const { manifest } = model;

  const keyById = new Map<string, KeyboardKey>();
  for (const k of model.keys) {
    if (keyById.has(k.keyId)) {
      push(issues, "error", "KEY_DUPLICATE", `Duplicate keyId: ${k.keyId}`);
    }
    if (k.modelId !== manifest.modelId) {
      push(
        issues,
        "warning",
        "MODEL_ID_MISMATCH",
        `key.modelId ${k.modelId} !== manifest.modelId ${manifest.modelId}`,
        k.keyId,
      );
    }
    keyById.set(k.keyId, k);
  }

  const traceById = new Map<string, KeyboardTrace>();
  for (const t of model.traces) {
    if (traceById.has(t.traceId)) {
      push(issues, "error", "TRACE_DUPLICATE", `Duplicate traceId: ${t.traceId}`);
    }
    if (t.modelId !== manifest.modelId) {
      push(
        issues,
        "warning",
        "MODEL_ID_MISMATCH",
        `trace.modelId ${t.modelId} !== manifest`,
        t.traceId,
      );
    }
    traceById.set(t.traceId, t);
  }

  const ribbonById = new Map<string, RibbonContact>();
  for (const c of model.ribbonContacts) {
    if (ribbonById.has(c.contactId)) {
      push(issues, "error", "RIBBON_DUPLICATE", `Duplicate contactId: ${c.contactId}`);
    }
    ribbonById.set(c.contactId, c);
  }

  const pathByTrace = new Map<string, TracePath[]>();
  for (const p of model.tracePaths) {
    if (p.modelId !== manifest.modelId) {
      push(issues, "warning", "MODEL_ID_MISMATCH", `path modelId mismatch`, p.pathId);
    }
    if (!traceById.has(p.traceId)) {
      push(
        issues,
        "error",
        "PATH_UNKNOWN_TRACE",
        `TracePath references unknown trace: ${p.traceId}`,
        p.pathId,
      );
    }
    if (!p.geometry || !p.geometry.trim()) {
      push(issues, "warning", "PATH_EMPTY_GEOMETRY", "TracePath has empty geometry", p.pathId);
    }
    const list = pathByTrace.get(p.traceId) ?? [];
    list.push(p);
    pathByTrace.set(p.traceId, list);
  }

  for (const t of model.traces) {
    if (!ribbonById.has(t.ribbonContactId)) {
      push(
        issues,
        "error",
        "TRACE_RIBBON_UNKNOWN",
        `Trace ${t.traceId} references unknown ribbon contact: ${t.ribbonContactId}`,
      );
    }
  }

  const byKey = new Map<string, KeyTraceMapEntry[]>();
  for (const m of model.keyTraceMap) {
    if (m.modelId !== manifest.modelId) {
      push(issues, "warning", "MODEL_ID_MISMATCH", `keyTraceMap modelId mismatch`, m.keyId);
    }
    if (!keyById.has(m.keyId)) {
      push(issues, "error", "MAP_UNKNOWN_KEY", `key_trace_map unknown key: ${m.keyId}`);
    }
    if (!traceById.has(m.traceId)) {
      push(
        issues,
        "error",
        "MAP_UNKNOWN_TRACE",
        `key_trace_map unknown trace: ${m.traceId}`,
        m.keyId,
      );
    }
    const g = byKey.get(m.keyId) ?? [];
    g.push(m);
    byKey.set(m.keyId, g);
  }

  for (const k of model.keys) {
    const list = byKey.get(k.keyId) ?? [];
    if (list.length === 0) {
      push(issues, "error", "KEY_UNMAPPED", `Key has no key_trace_map entries: ${k.keyId}`);
      continue;
    }
    if (list.length !== 2) {
      push(
        issues,
        "error",
        "KEY_NOT_TWO_TRACES",
        `Key ${k.keyId} should map to exactly 2 traces, got ${list.length}`,
      );
    }
    const roles = new Set(list.map((e) => e.role));
    if (!roles.has("pathA") || !roles.has("pathB")) {
      push(
        issues,
        "error",
        "KEY_ROLES",
        `Key ${k.keyId} must have one pathA and one pathB entry`,
      );
    }
    const tids = list.map((e) => e.traceId);
    if (new Set(tids).size !== tids.length) {
      push(issues, "error", "KEY_TRACE_DUP", `Key ${k.keyId} maps the same trace twice`);
    }
  }

  for (const [keyId, entries] of byKey) {
    if (!keyById.has(keyId)) {
      push(issues, "error", "ORPHAN_MAP", `key_trace_map references missing key: ${keyId}`);
    }
    if (entries.length > 0 && !entries.some((e) => e.keyId === keyId)) {
      /* unreachable */
    }
  }

  const baseIds = new Set(model.keys.map((k) => k.keyId));
  if (model.keyLayoutAlternates) {
    for (const alt of model.keyLayoutAlternates) {
      if (alt.keys.length !== model.keys.length) {
        push(
          issues,
          "error",
          "ALT_KEYS_COUNT",
          `keyLayoutAlternates[${alt.id}]: key count ${alt.keys.length} !== main keys ${model.keys.length}`,
        );
        continue;
      }
      for (const k of alt.keys) {
        if (!baseIds.has(k.keyId)) {
          push(issues, "error", "ALT_KEY_UNKNOWN", `keyLayoutAlternates[${alt.id}]: extra keyId ${k.keyId}`);
        }
      }
      for (const id of baseIds) {
        if (!alt.keys.some((k) => k.keyId === id)) {
          push(issues, "error", "ALT_KEY_MISSING", `keyLayoutAlternates[${alt.id}]: missing keyId ${id}`);
        }
      }
    }
  }

  for (const t of model.traces) {
    if (!pathByTrace.has(t.traceId) || (pathByTrace.get(t.traceId)?.length ?? 0) === 0) {
      push(
        issues,
        "warning",
        "TRACE_NO_PATHS",
        `No trace_paths entries for ${t.traceId} — overlays may be empty.`,
      );
    }
  }

  const hasErrors = issues.some((i) => i.level === "error");
  return {
    modelId: manifest.modelId,
    ok: !hasErrors,
    issues,
    counts: {
      keys: model.keys.length,
      traces: model.traces.length,
      paths: model.tracePaths.length,
      ribbonContacts: model.ribbonContacts.length,
      mappings: model.keyTraceMap.length,
    },
  };
}
