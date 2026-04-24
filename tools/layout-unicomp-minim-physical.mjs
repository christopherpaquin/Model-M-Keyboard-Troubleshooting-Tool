/**
 * Unicomp Mini M: TKL (no numpad) ANSI, same 1391401 x/y space as the SSK helper, with a true
 * 104+ style bottom row (Win / Menu). Hidden-matrix legs (matrix_aux_* in minimSharkLabels.mjs) are
 * not drawn on the primary key caps; they are placed in a small overflow strip (same as Unicomp 104
 * for matrix-only nodes) so the schematic only shows the physical TKL.
 */
import { buildLayoutIbmSskPhysical } from "./layout-ibm-ssk-physical.mjs";
import { BOTTOM_104_PLUS } from "./layout-unicomp-104-physical.mjs";

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
  const OVERFLOW_Y = 448;
  const OVERFLOW_X0 = 8;
  const matrixOnly = keyIds.filter((k) => k.startsWith("matrix_aux_"));
  for (let i = 0; i < matrixOnly.length; i++) {
    o[matrixOnly[i]] = [
      OVERFLOW_X0 + (i % 8) * 32,
      OVERFLOW_Y + ((i / 8) | 0) * 24,
      26,
      20,
    ];
  }
  return o;
}
