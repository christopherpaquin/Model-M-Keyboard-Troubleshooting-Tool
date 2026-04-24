/**
 * IBM 122-key “converged / 5250”-style key cap positions (schematic, ~same as generate-m122-package).
 * Use for ibm-122-terminal and ibm-122-converged so the diagram is not an alphabetical grid.
 *
 * Physical alignment target: PF13–24 / PF1–12 with column 1 over “1” and column 12 over “=”; clear
 * bezel under the PF block; Tab < Caps < L.Shift stepped widths; backspace, `\\`, Enter, r.shift, and
 * r.ctrl flush on the right; bottom row: L.Ctrl, ~½u gap, Alt, space, Alt, ~½u gap, r.Ctrl.
 * See docs/reference-ibm-model-m-122-5250.png in this repo.
 *
 * Raw coordinates: F13–F24 (y=0) and F1–F12 (y=30) are h=24. A deliberate vertical gap
 * (plastic bezel) sits between the bottom of the F block and the EX/main alnum area.
 * Nav/numpad share the same vertical band as the alnum. Nav is to the right of the main block.
 */
export const VIEW_TOP_PAD_122 = 100;

function R(x, y, w, h) {
  return [x, y + VIEW_TOP_PAD_122, w, h];
}

/**
 * @param {string[]} keyIds
 * @returns {Record<string, [number, number, number, number]>}
 */
export function buildLayoutIbm122Physical(keyIds) {
  const L = {};
  const bx = 100;
  // Main number row: backtick, 1..9, 0, -, = — F1..F12 / F13..F24 line up with 1..0,-,= (same x as those keys).
  const fw = 30;
  const fRowX = (f1to12) => {
    if (f1to12 <= 9) {
      return bx + 32 * f1to12;
    }
    if (f1to12 === 10) {
      return bx + 32 * 10;
    }
    if (f1to12 === 11) {
      return bx + 352;
    }
    return bx + 384;
  };
  const F13_ROW_Y = 0;
  const F1_ROW_Y = 30;
  const F_ROW_H = 24;
  for (let n = 1; n <= 12; n++) {
    const x = fRowX(n);
    L[`f${n + 12}`] = R(x, F13_ROW_Y, fw, F_ROW_H);
    L[`f${n}`] = R(x, F1_ROW_Y, fw, F_ROW_H);
  }
  // F1–12 bottom = F1_ROW_Y + F_ROW_H; open space (bezel) before EX / number row — large gap like the real 122.
  const GAP_BELOW_FUNCTION_BLOCK = 36;
  const MAIN0 = F1_ROW_Y + F_ROW_H + GAP_BELOW_FUNCTION_BLOCK;
  // Left EX block: five rows, aligned with main rows 0..4
  L.ex1 = R(0, MAIN0, 30, 24);
  L.ex2 = R(34, MAIN0, 30, 24);
  L.ex3 = R(0, MAIN0 + 30, 30, 24);
  L.ex4 = R(34, MAIN0 + 30, 30, 24);
  L.ex5 = R(0, MAIN0 + 60, 30, 24);
  L.ex6 = R(34, MAIN0 + 60, 30, 24);
  L.ex7 = R(0, MAIN0 + 90, 30, 24);
  L.ex8 = R(34, MAIN0 + 90, 30, 24);
  L.ex9 = R(0, MAIN0 + 120, 30, 24);
  L.ex10 = R(34, MAIN0 + 120, 30, 24);

  const y = (i) => MAIN0 + i * 30;
  /** Main block right edge: backspace, `\\`, enter, r.shift, r.ctrl share this outer column. */
  const MAIN_R = 556;
  const kw = 30;
  const p = 32;

  L.backtick = R(bx, y(0), 32, 26);
  for (let d = 1; d <= 9; d++) {
    L[`digit_${d}`] = R(bx + 32 * d, y(0), kw, 26);
  }
  L.digit_0 = R(bx + 32 * 10, y(0), kw, 26);
  L.minus = R(bx + 352, y(0), kw, 26);
  L.equal = R(bx + 384, y(0), kw, 26);
  L.backspace = R(MAIN_R - 40, y(0), 40, 26);

  // Left: Tab (narrow) < Caps < L.Shift (stagger like physical board). Right column: flush at MAIN_R.
  const wTab = 35;
  const wCaps = 45;
  const wLShift = 50;
  const gM = 4;

  const y1 = y(1);
  L.tab = R(bx, y1, wTab, 26);
  const l1 = bx + wTab + gM;
  for (const [i, ch] of ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"].entries()) {
    L[ch] = R(l1 + i * p, y1, kw, 26);
  }
  L.bracket_left = R(l1 + 10 * p, y1, kw, 26);
  L.bracket_right = R(l1 + 11 * p, y1, kw, 26);
  L.backslash = R(MAIN_R - 32, y1, 32, 26);

  const y2 = y(2);
  L.caps_lock = R(bx, y2, wCaps, 26);
  const l2 = bx + wCaps + gM;
  for (const [i, ch] of ["a", "s", "d", "f", "g", "h", "j", "k", "l"].entries()) {
    L[ch] = R(l2 + i * p, y2, kw, 26);
  }
  L.semicolon = R(l2 + 9 * p, y2, kw, 26);
  L.quote = R(l2 + 10 * p, y2, kw, 26);
  L.enter_main = R(MAIN_R - 52, y2, 52, 26);

  const y3 = y(3);
  L.left_shift = R(bx, y3, wLShift, 26);
  const l3 = bx + wLShift + gM;
  for (const [i, ch] of ["z", "x", "c", "v", "b", "n", "m"].entries()) {
    L[ch] = R(l3 + i * p, y3, kw, 26);
  }
  L.comma = R(l3 + 7 * p, y3, kw, 26);
  L.period = R(l3 + 8 * p, y3, kw, 26);
  L.slash = R(l3 + 9 * p, y3, kw, 26);
  // Touching r.shift: 474+32=506, r.shift 506+50; slash ends 472, gap2.
  L.intl_backslash = R(MAIN_R - 32 - 50, y3, 32, 26);
  L.right_shift = R(MAIN_R - 50, y3, 50, 26);

  // Bottom row: L.Ctrl under L.Shift; r.Ctrl under r.shift; ~½ key-unit gaps Control↔Alt (ref. photo).
  const yMod = y(4);
  const gCtrlAlt = 16;
  const gAltSpace = 2;
  const modCtrlW = 50;
  const modAltW = 32;
  const lCtrlX = bx;
  const lAltX = lCtrlX + modCtrlW + gCtrlAlt;
  const lAltR = lAltX + modAltW;
  const rCtrlX = MAIN_R - modCtrlW;
  const rCtrlR = rCtrlX + modCtrlW;
  const rAltR = rCtrlX - gCtrlAlt;
  const rAltX = rAltR - modAltW;
  const rAltL = rAltX;
  const spaceL = lAltR + gAltSpace;
  const spaceR = rAltL - gAltSpace;
  L.left_ctrl = R(lCtrlX, yMod, modCtrlW, 24);
  L.left_alt = R(lAltX, yMod, modAltW, 24);
  L.space = R(spaceL, yMod, Math.max(0, spaceR - spaceL), 24);
  L.right_alt = R(rAltX, yMod, modAltW, 24);
  L.right_ctrl = R(rCtrlX, yMod, modCtrlW, 24);
  // Matrix nub (k_nubs→euro1): not on the 5250 modifier row — tuck beside EX, left of the main key column.
  L.euro1 = R(64, yMod, 32, 24);

  // Nav cluster: clear column gap after main block (right edge ≈556); then numpad.
  const navx = 582;
  const nvy = MAIN0;
  L.insert = R(navx, nvy, 30, 24);
  L.home = R(navx + 32, nvy, 30, 24);
  L.page_up = R(navx + 64, nvy, 30, 24);
  L.delete = R(navx, nvy + 32, 30, 24);
  L.end = R(navx + 32, nvy + 32, 30, 24);
  L.page_down = R(navx + 64, nvy + 32, 30, 24);
  L.arrow_left = R(navx, nvy + 100, 30, 24);
  L.nav_center = R(navx + 32, nvy + 100, 30, 24);
  L.arrow_right = R(navx + 64, nvy + 100, 30, 24);
  L.arrow_up = R(navx + 32, nvy + 68, 30, 24);
  L.arrow_down = R(navx + 32, nvy + 132, 30, 24);

  const npx = 688;
  const npy0 = MAIN0;
  L.num_lock = R(npx, npy0, 32, 24);
  L.kp_slash = R(npx + 34, npy0, 32, 24);
  L.kp_asterisk = R(npx + 68, npy0, 32, 24);
  L.kp_minus = R(npx + 102, npy0, 32, 24);
  L.kp_7 = R(npx, npy0 + 32, 32, 24);
  L.kp_8 = R(npx + 34, npy0 + 32, 32, 24);
  L.kp_9 = R(npx + 68, npy0 + 32, 32, 24);
  // Tall +: spans 7–9 and 4–6 rows; bottom 32+56=88, then 2px gap to the 1–2–3 row (no overlap with Ent).
  L.kp_plus = R(npx + 102, npy0 + 32, 32, 56);
  L.kp_4 = R(npx, npy0 + 64, 32, 24);
  L.kp_5 = R(npx + 34, npy0 + 64, 32, 24);
  L.kp_6 = R(npx + 68, npy0 + 64, 32, 24);
  L.kp_1 = R(npx, npy0 + 90, 32, 24);
  L.kp_2 = R(npx + 34, npy0 + 90, 32, 24);
  L.kp_3 = R(npx + 68, npy0 + 90, 32, 24);
  L.kp_0 = R(npx, npy0 + 120, 48, 24);
  L.kp_decimal = R(npx + 52, npy0 + 120, 32, 24);
  // Ent: 1–2–3 and 0 rows only (tall key below +); 90+54=144 = bottom of 0 row.
  L.kp_enter = R(npx + 102, npy0 + 90, 32, 54);
  // Below numpad; shift with MAIN0 (was y≈292 when MAIN0≈58)
  const AUXY = MAIN0 + 210;
  L.matrix_aux_plus = R(800, AUXY, 28, 20);
  /** Shark CSV uses matrix_aux_kp_plus; numpad “+” second pole */
  L.matrix_aux_kp_plus = R(798, AUXY + 10, 32, 6);
  if (L.kp_minus) {
    L.qmk_raw_kp_minus = [L.kp_minus[0], L.kp_minus[1], L.kp_minus[2], L.kp_minus[3]];
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
