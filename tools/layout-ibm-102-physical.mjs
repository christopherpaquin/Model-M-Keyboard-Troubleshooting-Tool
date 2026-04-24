/**
 * Full-size 101/102 (ANSI) key geometry in SVG viewBox space (matches 1391401 hand layout).
 * Y includes top padding so keys sit below the ribbon gutter line (y=100) in the app.
 */
export const VIEW_TOP_PAD_102 = 120;

/** [x, y, w, h] before +VIEW_TOP_PAD_102 — same as generate-1391401-package LAYOUT_RAW. */
export const LAYOUT_RAW_102 = {
  esc: [16, 56, 36, 32],
  f1: [72, 56, 36, 32],
  f2: [112, 56, 36, 32],
  f3: [152, 56, 36, 32],
  f4: [192, 56, 36, 32],
  f5: [252, 56, 36, 32],
  f6: [292, 56, 36, 32],
  f7: [332, 56, 36, 32],
  f8: [372, 56, 36, 32],
  f9: [432, 56, 36, 32],
  f10: [472, 56, 36, 32],
  f11: [512, 56, 36, 32],
  f12: [552, 56, 36, 32],
  print_screen: [630, 56, 36, 32],
  scroll_lock: [670, 56, 36, 32],
  pause_break: [710, 56, 36, 32],
  backtick: [16, 104, 36, 36],
  digit_1: [56, 104, 36, 36],
  digit_2: [96, 104, 36, 36],
  digit_3: [136, 104, 36, 36],
  digit_4: [176, 104, 36, 36],
  digit_5: [216, 104, 36, 36],
  digit_6: [256, 104, 36, 36],
  digit_7: [296, 104, 36, 36],
  digit_8: [336, 104, 36, 36],
  digit_9: [376, 104, 36, 36],
  digit_0: [416, 104, 36, 36],
  minus: [456, 104, 36, 36],
  equal: [496, 104, 36, 36],
  backspace: [536, 104, 84, 36],
  tab: [16, 148, 54, 36],
  q: [76, 148, 36, 36],
  w: [116, 148, 36, 36],
  e: [156, 148, 36, 36],
  r: [196, 148, 36, 36],
  t: [236, 148, 36, 36],
  y: [276, 148, 36, 36],
  u: [316, 148, 36, 36],
  i: [356, 148, 36, 36],
  o: [396, 148, 36, 36],
  p: [436, 148, 36, 36],
  bracket_left: [476, 148, 36, 36],
  bracket_right: [516, 148, 36, 36],
  backslash: [556, 148, 64, 36],
  caps_lock: [16, 192, 62, 36],
  a: [84, 192, 36, 36],
  s: [124, 192, 36, 36],
  d: [164, 192, 36, 36],
  f: [204, 192, 36, 36],
  g: [244, 192, 36, 36],
  h: [284, 192, 36, 36],
  j: [324, 192, 36, 36],
  k: [364, 192, 36, 36],
  l: [404, 192, 36, 36],
  semicolon: [444, 192, 32, 36],
  quote: [480, 192, 32, 36],
  // US ANSI: one wide Enter, no ISO “#” key; right edge (620) lines up with backspace and backslash above.
  // quote ends 512; 4px gap, then 516+104=620
  enter_main: [516, 192, 104, 36],
  left_shift: [16, 236, 76, 36],
  z: [100, 236, 36, 36],
  x: [140, 236, 36, 36],
  c: [180, 236, 36, 36],
  v: [220, 236, 36, 36],
  b: [260, 236, 36, 36],
  n: [300, 236, 36, 36],
  m: [340, 236, 36, 36],
  comma: [380, 236, 36, 36],
  period: [420, 236, 36, 36],
  slash: [460, 236, 36, 36],
  right_shift: [500, 236, 126, 36],
  left_ctrl: [16, 280, 48, 36],
  left_alt: [72, 280, 48, 36],
  space: [128, 280, 260, 36],
  right_alt: [396, 280, 48, 36],
  right_ctrl: [452, 280, 48, 36],
  insert: [630, 104, 36, 36],
  home: [670, 104, 36, 36],
  page_up: [710, 104, 36, 36],
  delete: [630, 148, 36, 36],
  end: [670, 148, 36, 36],
  page_down: [710, 148, 36, 36],
  arrow_up: [670, 236, 36, 36],
  arrow_left: [630, 280, 36, 36],
  arrow_down: [670, 280, 36, 36],
  arrow_right: [710, 280, 36, 36],
  num_lock: [750, 104, 38, 36],
  kp_slash: [793, 104, 38, 36],
  kp_asterisk: [836, 104, 38, 36],
  kp_minus: [879, 104, 38, 36],
  kp_7: [750, 140, 38, 36],
  kp_8: [793, 140, 38, 36],
  kp_9: [836, 140, 38, 36],
  kp_plus: [879, 140, 38, 72],
  kp_4: [750, 176, 38, 36],
  kp_5: [793, 176, 38, 36],
  kp_6: [836, 176, 38, 36],
  kp_1: [750, 212, 38, 36],
  kp_2: [793, 212, 38, 36],
  kp_3: [836, 212, 38, 36],
  kp_enter: [879, 212, 38, 72],
  kp_0: [750, 248, 80, 36],
  kp_decimal: [838, 248, 36, 36],
};

/**
 * @type {Record<string, [number, number, number, number]>}
 */
export const LAYOUT_102 = Object.fromEntries(
  Object.entries(LAYOUT_RAW_102).map(([k, v]) => [k, [v[0], v[1] + VIEW_TOP_PAD_102, v[2], v[3]]]),
);

/** QMK-enhanced / aux keyIds that share a physical slot with a primary key. */
const ENHANCED_102_ALIASES = {
  intl_backslash: "enter_main",
  qmk_raw_kp_minus: "kp_minus",
};

/**
 * @param {string} keyId
 * @returns { [number, number, number, number] | null }
 */
export function getRectForIbm102EnhancedKey(keyId) {
  if (LAYOUT_102[keyId]) {
    return LAYOUT_102[keyId];
  }
  const alias = ENHANCED_102_ALIASES[keyId];
  if (alias && LAYOUT_102[alias]) {
    return LAYOUT_102[alias];
  }
  if (keyId === "euro1") {
    return [20, 104 + VIEW_TOP_PAD_102, 32, 36];
  }
  if (keyId === "matrix_aux_kp_plus" && LAYOUT_102.kp_plus) {
    const [x, y, w, h] = LAYOUT_102.kp_plus;
    return [x, y + h - 8, w, 6];
  }
  return null;
}
