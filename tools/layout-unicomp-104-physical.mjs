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

/** 102/104 alnum + numpad + 104+ bottom. No k_code: US boards often have no physical Code key. */
const MERGED_104 = { ...LAYOUT_102, ...BOTTOM_104_PLUS };

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
 * Matrix-only or duplicate-trace nodes on US 104: do not share a full cap with Enter, nuhs, €, Code,
 * or a second numpad Enter (avoids overlapped key rects and doubled legends).
 * @param {string} keyId
 * @returns {boolean}
 */
function isMatrixOnlyUnicomp104(keyId) {
  return (
    keyId === "lang5_code" ||
    keyId === "intl_backslash" ||
    keyId === "euro1" ||
    keyId === "qmk_raw_kp_enter_hidden"
  );
}

/**
 * @param {string} keyId
 * @returns { [number, number, number, number] | null }
 */
function rectForAuxOrOverlap(keyId) {
  if (isMatrixOnlyUnicomp104(keyId)) {
    return null;
  }
  if (keyId === "matrix_aux_bsp") {
    return edgeStrip(MERGED_104.backspace, "top", 8);
  }
  if (keyId === "matrix_aux_rsh") {
    return edgeStrip(MERGED_104.right_shift, "bottom", 7);
  }
  if (keyId === "matrix_aux_kp_0") {
    return edgeStrip(MERGED_104.kp_0, "bottom", 8);
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
  /** QMK-only / matrix nubs — not a physical 4th row. Keep them under the main board, not (800,~160) top-right. */
  const OVERFLOW_Y = 448;
  const OVERFLOW_X0 = 8;
  let j = 0;
  for (const k of keyIds.sort()) {
    if (L[k]) {
      continue;
    }
    L[k] = [
      OVERFLOW_X0 + (j % 8) * 32,
      OVERFLOW_Y + ((j / 8) | 0) * 24,
      26,
      20,
    ];
    j += 1;
  }
  return L;
}

export { MERGED_104, BOTTOM_104_PLUS, VIEW_TOP_PAD_102 };
