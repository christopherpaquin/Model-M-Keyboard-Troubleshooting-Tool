import type { KeyboardTrace, RibbonContact } from "./types";

export function makeRibbonList(
  modelTraces: KeyboardTrace[],
  ribbonById: Map<string, RibbonContact>,
  drawSet: Set<string>,
  isolate: boolean,
  focus: string | null,
): RibbonContact[] {
  const tids = new Set<string>();
  if (isolate && focus) tids.add(focus);
  else for (const t of drawSet) tids.add(t);
  return modelTraces
    .filter((m) => tids.has(m.traceId))
    .map((m) => ribbonById.get(m.ribbonContactId))
    .filter((x): x is RibbonContact => Boolean(x));
}
