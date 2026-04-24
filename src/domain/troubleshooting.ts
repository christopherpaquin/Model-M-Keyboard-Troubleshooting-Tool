import type { KeyboardTrace, KeyTraceMapEntry, TroubleshootingResult } from "./types";
import {
  defaultTraceSetForSelection,
  getTraceById,
  sharedTracesAmongDeadKeys,
  tracesForKey,
} from "./selectors";

export function buildTroubleshooting(
  map: KeyTraceMapEntry[],
  selectedDeadKeyIds: string[],
  traces: KeyboardTrace[],
): TroubleshootingResult {
  const traceById = getTraceById(traces);
  if (selectedDeadKeyIds.length === 0) {
    return {
      summaryLines: ["Select one or more keys on the layout that are not registering."],
      sharedTraceIds: [],
      perTraceNotes: {},
      comparisonSuggestions: [],
      advancedBullets: [
        "A dead key is not always caused by a broken membrane trace. Local wear, alignment, a bad rivet, or a damaged contact spot can also stop a key while neighbors still work.",
      ],
    };
  }

  const shared = sharedTracesAmongDeadKeys(map, selectedDeadKeyIds);
  const traceIdsForPerKeyNotes = defaultTraceSetForSelection(map, selectedDeadKeyIds);

  const summaryLines: string[] = [];
  if (selectedDeadKeyIds.length === 1) {
    summaryLines.push(
      "One unresponsive key is compatible with a local contact issue (wear, dirt, a bent or missing flipper) as well as trace problems. Compare with a few other keys on the same traces to narrow it down — but treat results as evidence, not proof.",
    );
  } else if (shared.length > 0) {
    summaryLines.push(
      `These keys share at least one membrane trace: ${formatTraceList(shared, traceById)}. A shared path issue (tail seating, tail wear, a cracked trace) becomes a bit more plausible when several keys on the same trace fail — still not certain without measurement.`,
    );
  } else {
    summaryLines.push(
      "These keys do not share a trace in this dataset. That pattern can happen when multiple local failures add up, when mapping data is still incomplete, or when causes are not trace-related. Avoid assuming a single global electrical break.",
    );
  }

  const perTraceNotes: Record<string, string[]> = {};
  for (const tid of traceIdsForPerKeyNotes) {
    const t = traceById.get(tid);
    perTraceNotes[tid] = [
      t?.description ?? "Trace path description not provided for this build.",
      "Reseat the membrane ribbon tail(s) and re-test. A poor connection can mimic a dead group of keys even when traces are intact.",
      "Inspect the exposed tail for creasing, contamination, and oxidation. Continuity at the board connector and along the run rules out a simple open trace — use your meter the way you normally would for continuity checks.",
    ];
  }

  const advancedBullets = [
    "Mechanical stack alignment, plate twist, a stuck stabilizer, or a damaged plunger/flipper can all prevent closure at a single key site.",
    "A trace can look good visually while failing under flex; conversely, a key can be dead with traces intact if the local carbon pill or contact pair is the weak point.",
    "If you change hardware or reassemble, re-run the same on-screen key checks so comparisons stay meaningful.",
  ];

  return {
    summaryLines,
    sharedTraceIds: shared,
    perTraceNotes,
    comparisonSuggestions: [],
    advancedBullets,
  };
}

function formatTraceList(
  ids: string[],
  traceById: Map<string, KeyboardTrace>,
): string {
  return ids
    .map((id) => traceById.get(id)?.displayName ?? id)
    .join(", ");
}

export function traceNarrationForKey(
  map: KeyTraceMapEntry[],
  traceById: Map<string, KeyboardTrace>,
  keyId: string,
): { membrane1Top: string; membrane2Bottom: string } {
  const entries = map.filter((e) => e.keyId === keyId);
  const pathA = entries.find((e) => e.role === "pathA");
  const pathB = entries.find((e) => e.role === "pathB");
  return {
    membrane1Top: pathB ? traceById.get(pathB.traceId)?.displayName ?? pathB.traceId : "—",
    membrane2Bottom: pathA ? traceById.get(pathA.traceId)?.displayName ?? pathA.traceId : "—",
  };
}

export function getTracesListForKeyIds(
  map: KeyTraceMapEntry[],
  keyIds: string[],
): { keyId: string; traceIds: string[] }[] {
  return keyIds.map((keyId) => ({ keyId, traceIds: tracesForKey(map, keyId) }));
}
