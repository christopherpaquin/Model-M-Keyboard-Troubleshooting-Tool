/**
 * Unicomp Endurapro (104) / full 101/104+ ANSI: same x/y scale as layout-ibm-102-physical
 * (1391401-style), with a true 104+ bottom row (Win / Menu) and slivers for hidden-matrix
 * k_*_hidden nodes that sit on a primary cap in QMK.
 */
import {
  LAYOUT_102,
  VIEW_TOP_PAD_102,
  getRectForIbm102EnhancedKey,
} from "./layout-ibm-102-physical.mjs";

/**
 * Replaces the old 5-key bottom (Ctrl / Alt / Space / Alt / Ctrl) with 8 keys:
 * Ctrl | Win | Alt | Space(6.25u-ish) | Alt | Win | Menu | Ctrl. Same y as 102.
 * @type {Record<string, [number, number, number, number]>}
 */
const BOTTOM_104_PLUS = {
  left_ctrl: [16, 400, 40, 36],
  os_left: [60, 400, 40, 36],
  left_alt: [104, 400, 40, 36],
  space: [148, 400, 200, 36],
  right_alt: [352, 400, 40, 36],
  os_right: [396, 400, 40, 36],
  app_menu: [440, 400, 40, 36],
  right_ctrl: [484, 400, 40, 36],
};

/**
 * k_code → Lang5 / "Code" — in the gap between F-row and nav cluster (no overlap with 620-wide main).
 */
const LANG5_CODE = [600, 220, 36, 32];

const MERGED_104 = { ...LAYOUT_102, ...BOTTOM_104_PLUS, lang5_code: LANG5_CODE };

/**
 * @param {string} id
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
function rectForAuxOrOverlap(keyId) {
  if (keyId === "matrix_aux_bsp") {
    return edgeStrip(MERGED_104.backspace, "top", 8);
  }
  if (keyId === "matrix_aux_rsh") {
    return edgeStrip(MERGED_104.right_shift, "bottom", 7);
  }
  if (keyId === "matrix_aux_kp_0") {
    return edgeStrip(MERGED_104.kp_0, "bottom", 8);
  }
  if (keyId === "qmk_raw_kp_enter_hidden") {
    return edgeStrip(MERGED_104.kp_enter, "top", 8);
  }
  return getRectForIbm102EnhancedKey(keyId);
}

/**
 * @param {string[]} keyIds
 * @returns {Record<string, [number, number, number, number]>}
 */
export function buildLayoutIbmUnicomp104Physical(keyIds) {
  const L = {};
  for (const k of keyIds) {
    const p = MERGED_104[k] ?? rectForAuxOrOverlap(k);
    if (p) {
      L[k] = p;
    }
  }
  let j = 0;
  for (const k of keyIds.sort()) {
    if (L[k]) {
      continue;
    }
    L[k] = [800 + (j % 4) * 32, 160 + ((j / 4) | 0) * 24, 28, 20];
    j += 1;
  }
  return L;
}

export { MERGED_104, BOTTOM_104_PLUS, VIEW_TOP_PAD_102 };
