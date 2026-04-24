/**
 * Unicomp Mini M: TKL (no numpad) ANSI, same 1391401 x/y space as the SSK helper, with a true
 * 104+ style bottom row (Win / Menu) and thin strips for LShift/RShift/Enter/Backsp hidden
 * matrix legs (matrix_aux_* in minimSharkLabels.mjs).
 */
import { LAYOUT_102, getRectForIbm102EnhancedKey } from "./layout-ibm-102-physical.mjs";
import { buildLayoutIbmSskPhysical } from "./layout-ibm-ssk-physical.mjs";
import { BOTTOM_104_PLUS } from "./layout-unicomp-104-physical.mjs";

/**
 * @param {[number, number, number, number] | null | undefined} r
 * @param {"top" | "bottom" | "left" | "right"} edge
 * @param {number} t
 * @returns {[number, number, number, number] | null}
 */
function edgeStrip(r, edge, t) {
  if (!r) {
    return null;
  }
  const [x, y, w, h] = r;
  if (edge === "top") {
    return [x, y, w, Math.min(t, h)];
  }
  if (edge === "bottom") {
    return [x, y + h - Math.min(t, h), w, Math.min(t, h)];
  }
  if (edge === "left") {
    return [x, y, Math.min(t, w), h];
  }
  if (edge === "right") {
    return [x + w - Math.min(t, w), y, Math.min(t, w), h];
  }
  return null;
}

/**
 * @param {string} keyId
 * @returns { [number, number, number, number] | null }
 */
function matrixAuxTklRect(keyId) {
  if (keyId === "matrix_aux_bsp") {
    return edgeStrip(LAYOUT_102.backspace, "top", 8);
  }
  if (keyId === "matrix_aux_lsh") {
    return edgeStrip(LAYOUT_102.left_shift, "bottom", 7);
  }
  if (keyId === "matrix_aux_rsh") {
    return edgeStrip(LAYOUT_102.right_shift, "bottom", 7);
  }
  if (keyId === "matrix_aux_enter") {
    return edgeStrip(LAYOUT_102.enter_main, "top", 8);
  }
  return getRectForIbm102EnhancedKey(keyId);
}

/**
 * @param {string[]} keyIds
 * @returns {Record<string, [number, number, number, number]>}
 */
export function buildLayoutIbmUnicompMinimPhysical(keyIds) {
  const o = { ...buildLayoutIbmSskPhysical(keyIds, "ansi") };
  for (const k of keyIds) {
    if (k in BOTTOM_104_PLUS) {
      o[k] = BOTTOM_104_PLUS[k];
    }
  }
  for (const k of keyIds) {
    if (k.startsWith("matrix_aux_")) {
      const m = matrixAuxTklRect(k);
      if (m) {
        o[k] = m;
      }
    }
  }
  return o;
}
