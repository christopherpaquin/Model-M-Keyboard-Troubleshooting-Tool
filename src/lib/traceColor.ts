function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SOLID_HUE = 200;
const DASHED_HUE = 32;

/**
 * One traceId → distinct color (legacy, single palette).
 * Prefer `strokeForTrace` so solid vs dashed layers are visually obvious.
 */
export function colorForTrace(traceId: string, alpha = 0.9): string {
  return strokeForTrace(traceId, alpha);
}

/** Membrane 2 (bottom) / `solid_*` / pathA = cool (blue) family. Membrane 1 (top) / `dashed_*` / pathB = warm (amber) family. */
export function strokeForTrace(traceId: string, alpha = 0.92): string {
  if (traceId.startsWith("solid_")) {
    const n = parseInt(traceId.replace("solid_", ""), 10) || 0;
    const h = (SOLID_HUE + (n - 1) * 2 + (hashId(traceId) % 5)) % 360;
    const s = 42 + (hashId(`s2:${traceId}`) % 18);
    const l = 50 + (hashId(`l2:${traceId}`) % 8);
    return `hsla(${h}deg ${s}% ${l}% / ${alpha})`;
  }
  if (traceId.startsWith("dashed_")) {
    const letter = traceId.replace("dashed_", "");
    const o = (letter.codePointAt(0) ?? 65) - 65;
    const h = (DASHED_HUE + o * 2 + (hashId(traceId) % 4)) % 360;
    const s = 48 + (hashId(`d2:${traceId}`) % 20);
    const l = 52 + (hashId(`dl:${traceId}`) % 8);
    return `hsla(${h}deg ${s}% ${l}% / ${alpha})`;
  }
  const h = hashId(traceId) % 320;
  return `hsla(${h + 20}deg 50% 52% / ${alpha})`;
}

export function isSolidLayerTrace(traceId: string): boolean {
  return traceId.startsWith("solid_");
}
