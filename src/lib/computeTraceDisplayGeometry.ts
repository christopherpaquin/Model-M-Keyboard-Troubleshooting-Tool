import type { KeyTraceMapEntry, KeyboardKey, KeyboardTrace, RibbonContact } from "../domain/types";
import { keysSharingTrace } from "../domain/selectors";

function polylineThroughPoints(points: [number, number][]): string {
  if (points.length === 0) return "";
  const [x0, y0] = points[0]!;
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    d += ` L ${p[0]} ${p[1]}`;
  }
  return d;
}

export function keyCenter(k: KeyboardKey): [number, number] {
  return [k.x + k.width / 2, k.y + k.height / 2];
}

function pinCenter(c: RibbonContact): [number, number] {
  return [c.x + c.width / 2, c.y + c.height / 2];
}

/**
 * Renders a readable schematic: straight pin → keys in top-to-bottom, then left-to-right
 * order. If exactly one key (focusKeyId) is selected and that key is on the trace, draws
 * a single segment pin → that key (two segments meet at the key for row and column).
 */
export function buildTracePathGeometry(
  traceId: string,
  keyById: Map<string, KeyboardKey>,
  keyTraceMap: KeyTraceMapEntry[],
  traces: KeyboardTrace[],
  ribbonById: Map<string, RibbonContact>,
  focusKeyId: string | null,
): string {
  const tr = traces.find((t) => t.traceId === traceId);
  if (!tr) return "";
  const contact = ribbonById.get(tr.ribbonContactId);
  if (!contact) return "";
  const displayPin: [number, number] = pinCenter(contact);
  const onTrace = keysSharingTrace(keyTraceMap, keyById, traceId);
  if (onTrace.length === 0) return "";
  onTrace.sort((a, b) => {
    const yd = a.y - b.y;
    if (Math.abs(yd) > 0.1) return yd;
    return a.x - b.x;
  });

  if (focusKeyId) {
    const onFocus = onTrace.find((k) => k.keyId === focusKeyId);
    if (onFocus) {
      return polylineThroughPoints([displayPin, keyCenter(onFocus)]);
    }
  }
  return polylineThroughPoints([displayPin, ...onTrace.map((k) => keyCenter(k))]);
}

const SOLID_TINT = "rgba(100, 155, 255, 0.14)";
const DASHED_TINT = "rgba(255, 185, 100, 0.12)";
const BLEND_TINT = "rgba(200, 165, 220, 0.16)";

/**
 * Fills for keys that lie on visible traces, so membership is clear without reading polylines.
 * When `isolate` is on, only `focusTraceId` contributes (matches path emphasis).
 */
export function keyRectFillTints(
  k: KeyboardKey,
  keyTraceMap: KeyTraceMapEntry[],
  visibleTraceIds: Set<string>,
  traceById: Map<string, KeyboardTrace>,
  isolate: boolean,
  focusTraceId: string | null,
  dead: boolean,
): { fill: string; borderExtra?: string } {
  if (dead) {
    return { fill: "rgba(240,113,120,0.22)" };
  }
  const tints: { solid: boolean; dashed: boolean } = { solid: false, dashed: false };
  for (const e of keyTraceMap) {
    if (e.keyId !== k.keyId) continue;
    if (!visibleTraceIds.has(e.traceId)) continue;
    if (isolate) {
      if (focusTraceId == null) continue;
      if (e.traceId !== focusTraceId) continue;
    }
    const t = traceById.get(e.traceId);
    if (!t) continue;
    if (t.layerId === "membrane_solid") tints.solid = true;
    if (t.layerId === "membrane_dashed") tints.dashed = true;
  }
  if (tints.solid && tints.dashed) {
    return { fill: BLEND_TINT, borderExtra: "rgba(200, 170, 230, 0.4)" };
  }
  if (tints.solid) return { fill: SOLID_TINT };
  if (tints.dashed) return { fill: DASHED_TINT };
  return { fill: "rgba(255,255,255,0.05)" };
}
