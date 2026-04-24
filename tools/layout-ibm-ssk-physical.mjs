/**
 * IBM Model M 104/105 SSK: full-size 101/102 *without* numpad — not a scan-order grid.
 * Two schematics: **ansi** = US (wide LShift, no key between LShift and Z) — default.
 * **iso** = short LShift, extra key (intl / “#” / nuhs) left of Z, matching ISO 105-style plates.
 */
import { LAYOUT_RAW_102, VIEW_TOP_PAD_102 } from "./layout-ibm-102-physical.mjs";

/** @typedef {"ansi" | "iso"} SskLayoutVariant */

const NUMPAD_KEY_IDS = new Set([
  "num_lock",
  "kp_slash",
  "kp_asterisk",
  "kp_minus",
  "kp_7",
  "kp_8",
  "kp_9",
  "kp_plus",
  "kp_4",
  "kp_5",
  "kp_6",
  "kp_1",
  "kp_2",
  "kp_3",
  "kp_enter",
  "kp_0",
  "kp_decimal",
]);

function R(x, y, w, h) {
  return [x, y + VIEW_TOP_PAD_102, w, h];
}

const ISO_SHIFT_ROW = {
  left_shift: [16, 236, 60, 36],
  intl_backslash: [82, 236, 32, 36],
  z: [120, 236, 36, 36],
  x: [160, 236, 36, 36],
  c: [200, 236, 36, 36],
  v: [240, 236, 36, 36],
  b: [280, 236, 36, 36],
  n: [320, 236, 36, 36],
  m: [360, 236, 36, 36],
  comma: [400, 236, 36, 36],
  period: [440, 236, 36, 36],
  slash: [480, 236, 36, 36],
  right_shift: [520, 236, 100, 36],
};

/** nubs / € — to the right of the main number row, same as 102 helper usage */
const SSK_EXTRAS = { euro1: [20, 104, 32, 36] };

/**
 * @param {SskLayoutVariant} variant
 * @returns {Record<string, [number, number, number, number]>}
 */
function buildLAYOUT_SSK(variant) {
  /** @type {Record<string, [number, number, number, number]>} */
  const raw = {};
  for (const [k, v] of Object.entries(LAYOUT_RAW_102)) {
    if (NUMPAD_KEY_IDS.has(k)) {
      continue;
    }
    raw[k] = v;
  }
  if (variant === "iso") {
    for (const [k, v] of Object.entries(ISO_SHIFT_ROW)) {
      raw[k] = v;
    }
  }
  for (const [k, v] of Object.entries(SSK_EXTRAS)) {
    raw[k] = v;
  }
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, R(v[0], v[1], v[2], v[3])]));
}

const LAYOUT_SSK_ANSI = buildLAYOUT_SSK("ansi");
const LAYOUT_SSK_ISO = buildLAYOUT_SSK("iso");

/**
 * @param {string[]} keyIds
 * @param {SskLayoutVariant} [variant] — default `"ansi"`.
 * @returns {Record<string, [number, number, number, number]>}
 */
export function buildLayoutIbmSskPhysical(keyIds, variant = "ansi") {
  const LAYOUT = variant === "iso" ? LAYOUT_SSK_ISO : LAYOUT_SSK_ANSI;
  const L = {};
  for (const k of keyIds) {
    const p = LAYOUT[k];
    if (p) {
      L[k] = p;
    }
  }
  let j = 0;
  for (const k of keyIds.sort()) {
    if (L[k]) {
      continue;
    }
    L[k] = R(650 + (j % 6) * 26, 200 + ((j / 6) | 0) * 24, 24, 20);
    j += 1;
  }
  return L;
}
