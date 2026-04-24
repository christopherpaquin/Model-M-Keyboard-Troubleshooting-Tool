import { keyCapLabel } from "../lib/keyCapLabel";
import type {
  ComparisonKeySuggestion,
  KeyboardKey,
  KeyTraceMapEntry,
  KeyboardTrace,
  RibbonContact,
} from "./types";

export function tracesForKey(
  map: KeyTraceMapEntry[],
  keyId: string,
): string[] {
  const t = new Set<string>();
  for (const e of map) {
    if (e.keyId === keyId) t.add(e.traceId);
  }
  return [...t];
}

export function tracesForKeys(
  map: KeyTraceMapEntry[],
  keyIds: Iterable<string>,
): string[] {
  const t = new Set<string>();
  for (const k of keyIds) {
    for (const tid of tracesForKey(map, k)) t.add(tid);
  }
  return [...t];
}

/**
 * Default traces to show for a dead-key selection.
 * - **0 keys:** none
 * - **1 key:** both (Membrane 1 + Membrane 2) for that key
 * - **2+ keys:** **intersection** only — a trace appears if *every* selected key uses it (highlights a plausible shared break)
 */
export function defaultTraceSetForSelection(
  map: KeyTraceMapEntry[],
  keyIds: readonly string[],
): string[] {
  if (keyIds.length === 0) return [];
  if (keyIds.length === 1) {
    return tracesForKey(map, keyIds[0]!);
  }
  let acc = new Set(tracesForKey(map, keyIds[0]!));
  for (let i = 1; i < keyIds.length; i++) {
    const cur = new Set(tracesForKey(map, keyIds[i]!));
    acc = new Set([...acc].filter((t) => cur.has(t)));
  }
  return [...acc];
}

export function keysSharingTrace(
  map: KeyTraceMapEntry[],
  keyById: Map<string, KeyboardKey>,
  traceId: string,
): KeyboardKey[] {
  const out: KeyboardKey[] = [];
  const seen = new Set<string>();
  for (const e of map) {
    if (e.traceId === traceId && !seen.has(e.keyId) && keyById.has(e.keyId)) {
      seen.add(e.keyId);
      out.push(keyById.get(e.keyId)!);
    }
  }
  out.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.keyId.localeCompare(b.keyId));
  return out;
}

export function sharedTracesAmongDeadKeys(map: KeyTraceMapEntry[], deadKeyIds: string[]): string[] {
  if (deadKeyIds.length < 2) return [];
  return defaultTraceSetForSelection(map, deadKeyIds);
}

export function ribbonForTraces(
  traceById: Map<string, KeyboardTrace>,
  ribbonById: Map<string, RibbonContact>,
  traceIds: string[],
): RibbonContact[] {
  const out: RibbonContact[] = [];
  const seen = new Set<string>();
  for (const tid of traceIds) {
    const tr = traceById.get(tid);
    if (!tr) continue;
    const c = ribbonById.get(tr.ribbonContactId);
    if (c && !seen.has(c.contactId)) {
      seen.add(c.contactId);
      out.push(c);
    }
  }
  return out;
}

const DEFAULT_REASON = "Also uses this trace; useful to test continuity vs. a one-off contact.";

export function suggestComparisonKeys(
  map: KeyTraceMapEntry[],
  keyById: Map<string, KeyboardKey>,
  focusKeyIds: string[],
  focusTraceIds: string[],
  limit = 3,
): ComparisonKeySuggestion[] {
  if (focusTraceIds.length === 0) return [];
  const dead = new Set(focusKeyIds);
  const candidates: { key: KeyboardKey; traceId: string; score: number }[] = [];
  for (const traceId of focusTraceIds) {
    for (const k of keysSharingTrace(map, keyById, traceId)) {
      if (dead.has(k.keyId)) continue;
      const score = k.recognitionRank ?? 0;
      candidates.push({ key: k, traceId, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.key.keyId.localeCompare(b.key.keyId));
  const picked: ComparisonKeySuggestion[] = [];
  const usedKeys = new Set<string>();
  for (const c of candidates) {
    if (picked.length >= limit) break;
    if (usedKeys.has(c.key.keyId)) continue;
    usedKeys.add(c.key.keyId);
    picked.push({
      keyId: c.key.keyId,
      displayName: keyCapLabel(c.key.keyId, c.key.displayName),
      traceId: c.traceId,
      reason: DEFAULT_REASON,
    });
  }
  return picked;
}

export function getTraceById(
  traces: KeyboardTrace[],
): Map<string, KeyboardTrace> {
  return new Map(traces.map((t) => [t.traceId, t]));
}

export function getKeyById(keys: KeyboardKey[]): Map<string, KeyboardKey> {
  return new Map(keys.map((k) => [k.keyId, k]));
}

export function getRibbonById(contacts: RibbonContact[]): Map<string, RibbonContact> {
  return new Map(contacts.map((c) => [c.contactId, c]));
}
