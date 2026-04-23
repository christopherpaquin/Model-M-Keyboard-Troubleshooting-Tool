/**
 * Generates YAML model files for IBM 1391401 102-key ANSI.
 * - Solid (pathA): kbupgrade 1391401.matrix row lines (one row trace per key).
 * - Dashed (pathB): column index C0..C7 from modelm-102-key-1391401/ansi-matrix.json
 *   mapped to dashed_A..dashed_H. The source file lists many duplicate (R,C) pairs for
 *   different keys; those cells are not unique. We use only the column letter for the
 *   dashed layer, with solid from kbupgrade, so each key still gets a unique (solid, dashed) pair.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "models", "ibm-1391401-ansi");
const MATRIX_JSON = path.join(root, "modelm-102-key-1391401", "ansi-matrix.json");

/** kbupgrade token -> stable keyId */
const TOKEN_MAP = {
  KEY_esc: "esc",
  KEY_grave: "backtick",
  KEY_1: "digit_1",
  KEY_2: "digit_2",
  KEY_3: "digit_3",
  KEY_4: "digit_4",
  KEY_5: "digit_5",
  KEY_6: "digit_6",
  KEY_7: "digit_7",
  KEY_8: "digit_8",
  KEY_9: "digit_9",
  KEY_0: "digit_0",
  KEY_minus: "minus",
  KEY_equal: "equal",
  KEY_tab: "tab",
  KEY_Q: "q",
  KEY_W: "w",
  KEY_E: "e",
  KEY_R: "r",
  KEY_T: "t",
  KEY_Y: "y",
  KEY_U: "u",
  KEY_I: "i",
  KEY_O: "o",
  KEY_P: "p",
  KEY_lbr: "bracket_left",
  KEY_rbr: "bracket_right",
  KEY_bckslsh: "backslash",
  KEY_cpslck: "caps_lock",
  KEY_A: "a",
  KEY_S: "s",
  KEY_D: "d",
  KEY_F: "f",
  KEY_G: "g",
  KEY_H: "h",
  KEY_J: "j",
  KEY_K: "k",
  KEY_L: "l",
  KEY_smcol: "semicolon",
  KEY_ping: "quote",
  KEY_hash: "intl_hash",
  KEY_Z: "z",
  KEY_X: "x",
  KEY_C: "c",
  KEY_V: "v",
  KEY_B: "b",
  KEY_N: "n",
  KEY_M: "m",
  KEY_comma: "comma",
  KEY_dot: "period",
  KEY_slash: "slash",
  MOD_LSHIFT: "left_shift",
  MOD_RSHIFT: "right_shift",
  MOD_LCTRL: "left_ctrl",
  MOD_RCTRL: "right_ctrl",
  MOD_LALT: "left_alt",
  MOD_RALT: "right_alt",
  KEY_spc: "space",
  KEY_F1: "f1",
  KEY_F2: "f2",
  KEY_F3: "f3",
  KEY_F4: "f4",
  KEY_F5: "f5",
  KEY_F6: "f6",
  KEY_F7: "f7",
  KEY_F8: "f8",
  KEY_F9: "f9",
  KEY_F10: "f10",
  KEY_F11: "f11",
  KEY_F12: "f12",
  KEY_bckspc: "backspace",
  KEY_enter: "enter_main",
  KEY_ins: "insert",
  KEY_home: "home",
  KEY_pgup: "page_up",
  KEY_del: "delete",
  KEY_end: "end",
  KEY_pgdn: "page_down",
  KEY_uarr: "arrow_up",
  KEY_darr: "arrow_down",
  KEY_larr: "arrow_left",
  KEY_rarr: "arrow_right",
  KEY_PrtScr: "print_screen",
  KEY_scrlck: "scroll_lock",
  KEY_break: "pause_break",
  KEY_numlock: "num_lock",
  KEY_KPslash: "kp_slash",
  KEY_KPast: "kp_asterisk",
  KEY_KPminus: "kp_minus",
  KEY_KPplus: "kp_plus",
  KEY_KPenter: "kp_enter",
  KEY_KPdot: "kp_decimal",
  KEY_KP0: "kp_0",
  KEY_KP1: "kp_1",
  KEY_KP2: "kp_2",
  KEY_KP3: "kp_3",
  KEY_KP4: "kp_4",
  KEY_KP5: "kp_5",
  KEY_KP6: "kp_6",
  KEY_KP7: "kp_7",
  KEY_KP8: "kp_8",
  KEY_KP9: "kp_9",
  KEY_Euro: "intl_extra",
};

const ROW_LINES = [
  ["KEY_Z", "KEY_tab", "KEY_Q", "KEY_A", "KEY_grave", "KEY_1", "KEY_esc"],
  ["KEY_X", "KEY_S", "KEY_W", "KEY_2", "KEY_F1", "KEY_cpslck", "KEY_Euro"],
  ["KEY_C", "KEY_D", "KEY_E", "KEY_3", "KEY_F2", "KEY_F3", "KEY_F4"],
  ["KEY_B", "KEY_V", "KEY_G", "KEY_F", "KEY_T", "KEY_R", "KEY_5", "KEY_4"],
  ["KEY_spc", "KEY_F5", "KEY_F9", "KEY_F10", "KEY_bckspc", "KEY_enter", "KEY_bckslsh"],
  ["KEY_N", "KEY_M", "KEY_H", "KEY_J", "KEY_Y", "KEY_U", "KEY_6", "KEY_7"],
  ["KEY_K", "KEY_I", "KEY_8", "KEY_F6", "KEY_comma", "KEY_equal", "KEY_rbr"],
  ["KEY_dot", "KEY_L", "KEY_O", "KEY_9", "KEY_F7", "KEY_F8"],
  ["KEY_P", "KEY_0", "KEY_lbr", "KEY_ping", "KEY_slash", "KEY_smcol", "KEY_minus", "KEY_hash"],
  ["KEY_F11", "KEY_del", "KEY_KP1", "KEY_KP4", "KEY_KP7", "KEY_darr", "KEY_numlock"],
  ["KEY_F12", "KEY_ins", "KEY_KP0", "KEY_KP2", "KEY_KP5", "KEY_KP8", "KEY_rarr", "KEY_KPslash"],
  ["KEY_pgup", "KEY_pgdn", "KEY_KP3", "KEY_KP6", "KEY_KP9", "KEY_KPast", "KEY_KPdot", "KEY_KPminus"],
  ["KEY_larr", "KEY_uarr", "KEY_end", "KEY_home", "KEY_break", "KEY_KPplus", "KEY_KPenter"],
  ["MOD_LALT", "MOD_RALT", "KEY_PrtScr", "KEY_scrlck"],
  ["MOD_LCTRL", "MOD_RCTRL"],
  ["MOD_LSHIFT", "MOD_RSHIFT"],
];

function solidTraceId(rowIndex) {
  const n = rowIndex + 1;
  return `solid_${String(n).padStart(2, "0")}`;
}

/**
 * Pushes the key grid below the membrane/ribbon header (larger than before
 * so tail diagram + pin labels are readable; keys start below that band).
 */
const VIEW_TOP_PAD = 120;

/** Approximate ANSI 101 layout in SVG space (viewBox units) — *before* VIEW_TOP_PAD. */
const LAYOUT_RAW = {
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
  /** F-row system keys: wider spacing so labels do not stack (Prt/Scr/Pause / Int). */
  print_screen: [588, 56, 40, 32],
  scroll_lock: [636, 56, 40, 32],
  pause_break: [684, 56, 40, 32],
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
  intl_hash: [516, 192, 28, 36],
  /** One-row ANSI “wide” Enter — not ISO vertical. */
  enter_main: [548, 192, 52, 36],
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
  /** Stops before the nav block at x≈612 */
  right_shift: [480, 236, 100, 36],
  left_ctrl: [16, 280, 48, 36],
  left_alt: [72, 280, 48, 36],
  space: [128, 280, 260, 36],
  right_alt: [396, 280, 48, 36],
  right_ctrl: [452, 280, 48, 36],
  /** Inset 6+ — cleared of Bksp (x≤620) and `\\` (x≤620), so no overlap. */
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
  /** Numpad: 4% wider keys + 5px gutters so adjacent labels do not read as one. */
  num_lock: [750, 56, 38, 32],
  kp_slash: [793, 56, 38, 32],
  kp_asterisk: [836, 56, 38, 32],
  kp_minus: [879, 56, 38, 32],
  kp_7: [750, 104, 38, 36],
  kp_8: [793, 104, 38, 36],
  kp_9: [836, 104, 38, 36],
  /**
   * Tall “+” spans 789 and 456 (two full key rows). Raw height = 2×36 + row gap, same as
   * reading-order gap between 7-row and 4-row (8px).
   */
  kp_plus: [879, 104, 38, 120],
  kp_4: [750, 188, 38, 36],
  kp_5: [793, 188, 38, 36],
  kp_6: [836, 188, 38, 36],
  kp_1: [750, 240, 38, 36],
  kp_2: [793, 240, 38, 36],
  kp_3: [836, 240, 38, 36],
  /** Two-row Enter beside 123 and 0. */
  kp_enter: [879, 240, 38, 80],
  kp_0: [750, 320, 80, 36],
  kp_decimal: [838, 320, 36, 36],
  /**
   * Unusual key — kept in layout for matrix ID but off the F-row to avoid numpad overlap
   * (place bottom-left, below the alpha block and away from the numpad).
   */
  intl_extra: [4, 360, 32, 16],
};

const LAYOUT = Object.fromEntries(
  Object.entries(LAYOUT_RAW).map(([k, v]) => [k, [v[0], v[1] + VIEW_TOP_PAD, v[2], v[3]]]),
);

const DISPLAY = {
  esc: "Esc",
  backtick: "`",
  digit_1: "1",
  digit_2: "2",
  digit_3: "3",
  digit_4: "4",
  digit_5: "5",
  digit_6: "6",
  digit_7: "7",
  digit_8: "8",
  digit_9: "9",
  digit_0: "0",
  minus: "-",
  equal: "=",
  backspace: "Bksp",
  tab: "Tab",
  q: "Q",
  w: "W",
  e: "E",
  r: "R",
  t: "T",
  y: "Y",
  u: "U",
  i: "I",
  o: "O",
  p: "P",
  bracket_left: "[",
  bracket_right: "]",
  backslash: "\\",
  caps_lock: "Caps",
  a: "A",
  s: "S",
  d: "D",
  f: "F",
  g: "G",
  h: "H",
  j: "J",
  k: "K",
  l: "L",
  semicolon: ";",
  quote: "'",
  intl_hash: "#",
  enter_main: "Enter",
  left_shift: "Shift",
  z: "Z",
  x: "X",
  c: "C",
  v: "V",
  b: "B",
  n: "N",
  m: "M",
  comma: ",",
  period: ".",
  slash: "/",
  right_shift: "Shift",
  left_ctrl: "Ctrl",
  left_alt: "Alt",
  space: "Space",
  right_alt: "Alt",
  right_ctrl: "Ctrl",
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  f5: "F5",
  f6: "F6",
  f7: "F7",
  f8: "F8",
  f9: "F9",
  f10: "F10",
  f11: "F11",
  f12: "F12",
  print_screen: "PrtSc",
  scroll_lock: "ScrLk",
  pause_break: "Pause",
  insert: "Ins",
  home: "Home",
  page_up: "PgUp",
  delete: "Del",
  end: "End",
  page_down: "PgDn",
  arrow_up: "↑",
  arrow_left: "←",
  arrow_down: "↓",
  arrow_right: "→",
  num_lock: "Num",
  kp_slash: "/",
  kp_asterisk: "*",
  kp_minus: "-",
  kp_plus: "+",
  kp_enter: "Ent",
  kp_0: "0",
  kp_1: "1",
  kp_2: "2",
  kp_3: "3",
  kp_4: "4",
  kp_5: "5",
  kp_6: "6",
  kp_7: "7",
  kp_8: "8",
  kp_9: "9",
  kp_decimal: ".",
  intl_extra: "Intl",
};

const SECTION = {
  function: new Set([
    "esc",
    "f1",
    "f2",
    "f3",
    "f4",
    "f5",
    "f6",
    "f7",
    "f8",
    "f9",
    "f10",
    "f11",
    "f12",
    "print_screen",
    "scroll_lock",
    "pause_break",
  ]),
  navigation: new Set([
    "insert",
    "home",
    "page_up",
    "delete",
    "end",
    "page_down",
    "arrow_up",
    "arrow_left",
    "arrow_down",
    "arrow_right",
  ]),
  numpad: new Set([
    "num_lock",
    "kp_slash",
    "kp_asterisk",
    "kp_minus",
    "kp_plus",
    "kp_enter",
    "kp_0",
    "kp_1",
    "kp_2",
    "kp_3",
    "kp_4",
    "kp_5",
    "kp_6",
    "kp_7",
    "kp_8",
    "kp_9",
    "kp_decimal",
  ]),
};

function sectionFor(keyId) {
  if (SECTION.function.has(keyId)) return "function";
  if (SECTION.navigation.has(keyId)) return "navigation";
  if (SECTION.numpad.has(keyId)) return "numpad";
  return "main";
}

function dashedFromX(x, w) {
  const cx = x + w / 2;
  const bands = [
    [0, 120],
    [120, 200],
    [200, 280],
    [280, 360],
    [360, 440],
    [440, 520],
    [520, 640],
    [640, 920],
  ];
  for (let i = 0; i < bands.length; i++) {
    const [a, b] = bands[i];
    if (cx >= a && cx < b) return `dashed_${String.fromCharCode("A".charCodeAt(0) + i)}`;
  }
  return "dashed_H";
}

/** Keys in ansi-matrix.json (labels) -> keyId used in LAYOUT / keys.yaml */
const MATRIX_LABEL_TO_KEYID = {
  ESC: "esc",
  F1: "f1",
  F2: "f2",
  F3: "f3",
  F4: "f4",
  F5: "f5",
  F6: "f6",
  F7: "f7",
  F8: "f8",
  F9: "f9",
  F10: "f10",
  F11: "f11",
  F12: "f12",
  PRINT_SCREEN: "print_screen",
  SCROLL_LOCK: "scroll_lock",
  PAUSE: "pause_break",
  "`": "backtick",
  1: "digit_1",
  2: "digit_2",
  3: "digit_3",
  4: "digit_4",
  5: "digit_5",
  6: "digit_6",
  7: "digit_7",
  8: "digit_8",
  9: "digit_9",
  0: "digit_0",
  "-": "minus",
  "=": "equal",
  BACKSPACE: "backspace",
  TAB: "tab",
  Q: "q",
  W: "w",
  E: "e",
  R: "r",
  T: "t",
  Y: "y",
  U: "u",
  I: "i",
  O: "o",
  P: "p",
  "[": "bracket_left",
  "]": "bracket_right",
  "\\": "backslash",
  CAPS_LOCK: "caps_lock",
  A: "a",
  S: "s",
  D: "d",
  F: "f",
  G: "g",
  H: "h",
  J: "j",
  K: "k",
  L: "l",
  ";": "semicolon",
  "'": "quote",
  ENTER: "enter_main",
  SHIFT_L: "left_shift",
  Z: "z",
  X: "x",
  C: "c",
  V: "v",
  B: "b",
  N: "n",
  M: "m",
  ",": "comma",
  ".": "period",
  "/": "slash",
  SHIFT_R: "right_shift",
  CTRL_L: "left_ctrl",
  ALT_L: "left_alt",
  SPACE: "space",
  ALT_R: "right_alt",
  CTRL_R: "right_ctrl",
  INSERT: "insert",
  DELETE: "delete",
  HOME: "home",
  END: "end",
  PAGE_UP: "page_up",
  PAGE_DOWN: "page_down",
  ARROW_UP: "arrow_up",
  ARROW_LEFT: "arrow_left",
  ARROW_DOWN: "arrow_down",
  ARROW_RIGHT: "arrow_right",
  NUM_LOCK: "num_lock",
  KP_DIVIDE: "kp_slash",
  KP_MULTIPLY: "kp_asterisk",
  KP_MINUS: "kp_minus",
  KP_7: "kp_7",
  KP_8: "kp_8",
  KP_9: "kp_9",
  KP_PLUS: "kp_plus",
  KP_4: "kp_4",
  KP_5: "kp_5",
  KP_6: "kp_6",
  KP_1: "kp_1",
  KP_2: "kp_2",
  KP_3: "kp_3",
  KP_ENTER: "kp_enter",
  KP_0: "kp_0",
  KP_DECIMAL: "kp_decimal",
};

function colTokenToDashed(c) {
  const m = /^C([0-7])$/.exec(c);
  if (!m) throw new Error(`Invalid column token: ${c}`);
  return `dashed_${String.fromCharCode(65 + parseInt(m[1], 10))}`;
}

function loadDashedFromMatrixFile() {
  if (!fs.existsSync(MATRIX_JSON)) {
    throw new Error(`Missing matrix file: ${MATRIX_JSON}`);
  }
  const raw = JSON.parse(fs.readFileSync(MATRIX_JSON, "utf8"));
  /** @type {Map<string, string>} */
  const byKeyId = new Map();
  for (const [label, pair] of Object.entries(raw.matrix ?? {})) {
    const keyId = MATRIX_LABEL_TO_KEYID[label];
    if (!keyId) continue;
    if (!Array.isArray(pair) || pair.length < 2) continue;
    byKeyId.set(keyId, colTokenToDashed(pair[1]));
  }
  return { metadata: raw.metadata, byKeyId };
}

function recognitionRank(keyId) {
  const easy = new Set([
    "space",
    "enter_main",
    "backspace",
    "left_shift",
    "digit_1",
    "digit_2",
    "q",
    "a",
    "z",
    "kp_5",
    "kp_enter",
  ]);
  if (easy.has(keyId)) return 10;
  if (keyId.startsWith("f")) return 6;
  return 3;
}

function buildKeys(modelId) {
  const keys = [];
  for (const [keyId, geom] of Object.entries(LAYOUT)) {
    const [x, y, width, height] = geom;
    keys.push({
      modelId,
      keyId,
      displayName: DISPLAY[keyId] ?? keyId,
      advancedName: keyId,
      section: sectionFor(keyId),
      x,
      y,
      width,
      height,
      recognitionRank: recognitionRank(keyId),
    });
  }
  for (let i = 0; i < keys.length; i++) {
    keys[i].sortOrder = keys[i].y * 1000 + keys[i].x + i;
  }
  return keys;
}

function buildSolidAssignments() {
  /** @type {Map<string, string>} */
  const map = new Map();
  ROW_LINES.forEach((tokens, idx) => {
    const tid = solidTraceId(idx);
    for (const tok of tokens) {
      const kid = TOKEN_MAP[tok];
      if (!kid) throw new Error(`Unknown token ${tok}`);
      map.set(kid, tid);
    }
  });
  return map;
}

function buildKeyTraceMap(modelId, keys, solidMap, dashedByKeyId) {
  const rows = [];
  for (const k of keys) {
    const solid = solidMap.get(k.keyId);
    if (!solid) {
      throw new Error(`Missing solid trace for ${k.keyId}`);
    }
    const dashed = dashedByKeyId.get(k.keyId) ?? dashedFromX(k.x, k.width);
    rows.push(
      { modelId, keyId: k.keyId, traceId: solid, role: "pathA" },
      { modelId, keyId: k.keyId, traceId: dashed, role: "pathB" },
    );
  }
  return rows;
}

/**
 * Pin boxes in the same 920px-wide space as the keyboard (see `SvgRibbonGutter` in the app; keep in sync).
 */
function ribbonContacts(modelId) {
  const contacts = [];
  /** Pin boxes sit below the section titles in the SVG (see SvgRibbonGutter) so labels do not overlap. */
  const y = 32;
  const h = 32;
  const wSolid = 24;
  const gSolid = 4;
  for (let i = 1; i <= 16; i++) {
    const id = `ribbon_s_${String(i).padStart(2, "0")}`;
    const x = 8 + (i - 1) * (wSolid + gSolid);
    contacts.push({
      modelId,
      contactId: id,
      layerId: "membrane_solid",
      contactNumber: String(i),
      x,
      y,
      width: wSolid,
      height: h,
      label: `Vertical tail contact ${i}`,
    });
  }
  const gapBetweenBands = 16;
  const solidRight = 8 + 16 * (wSolid + gSolid) - gSolid; // 452
  const dashStartX = solidRight + gapBetweenBands; // 468
  const wDash = 28;
  const gDash = 6;
  for (let i = 0; i < 8; i++) {
    const letter = String.fromCharCode("A".charCodeAt(0) + i);
    const id = `ribbon_d_${letter}`;
    const x = dashStartX + i * (wDash + gDash);
    contacts.push({
      modelId,
      contactId: id,
      layerId: "membrane_dashed",
      contactNumber: letter,
      x,
      y,
      width: wDash,
      height: h,
      label: `Horizontal tail contact ${letter}`,
    });
  }
  return contacts;
}

function traces(modelId) {
  const t = [];
  for (let i = 1; i <= 16; i++) {
    const tid = `solid_${String(i).padStart(2, "0")}`;
    t.push({
      modelId,
      traceId: tid,
      displayName: `Vertical trace ${i}`,
      layerId: "membrane_solid",
      ribbonContactId: `ribbon_s_${String(i).padStart(2, "0")}`,
      description: `Continuous vertical path ${i} of 16 (kbupgrade row line ${i} → model pathA).`,
    });
  }
  for (let i = 0; i < 8; i++) {
    const letter = String.fromCharCode("A".charCodeAt(0) + i);
    const tid = `dashed_${letter}`;
    t.push({
      modelId,
      traceId: tid,
      displayName: `Horizontal trace ${letter}`,
      layerId: "membrane_dashed",
      ribbonContactId: `ribbon_d_${letter}`,
      description: `Horizontal (dotted-line layer) path ${letter} of 8 (C${i} in modelm-102-key-1391401/ansi-matrix.json → model pathB).`,
    });
  }
  return t;
}

function polylineThroughPoints(points) {
  if (points.length === 0) return "M 0 0";
  const [x0, y0] = points[0];
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`;
  }
  return d;
}

function buildTracePaths(modelId, keys, tracesList, solidMap, dashedByKeyId, contactById) {
  /** @type {Map<string, string[]>} */
  const keysByTrace = new Map();
  for (const tr of tracesList) keysByTrace.set(tr.traceId, []);
  for (const k of keys) {
    const d = dashedByKeyId.get(k.keyId) ?? dashedFromX(k.x, k.width);
    keysByTrace.get(solidMap.get(k.keyId))?.push(k.keyId);
    keysByTrace.get(d)?.push(k.keyId);
  }
  const paths = [];
  let pid = 0;
  for (const tr of tracesList) {
    const kids = [...new Set(keysByTrace.get(tr.traceId) ?? [])];
    const cdef = contactById.get(tr.ribbonContactId);
    if (!cdef) {
      throw new Error(`No ribbon contact ${tr.ribbonContactId} for path ${tr.traceId}`);
    }
    const pin = [cdef.x + cdef.width / 2, cdef.y + cdef.height / 2];
    const centers = kids
      .map((id) => {
        const g = LAYOUT[id];
        if (!g) return null;
        return [g[0] + g[2] / 2, g[1] + g[3] / 2];
      })
      .filter((p) => p != null);
    centers.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const spine = [[pin[0], pin[1]], ...centers.slice(0, 32)];
    const geometry = polylineThroughPoints(spine);
    paths.push({
      modelId,
      traceId: tr.traceId,
      pathId: `path_${String(pid++).padStart(3, "0")}`,
      geometry,
      pathType: "overlay",
      label: tr.displayName,
    });
  }
  return paths;
}

function manifest(modelId) {
  return {
    modelId,
    displayName: "IBM Model M 102-key ANSI (1391401 / 1391404 class)",
    family: "IBM Model M",
    layoutName: "102-key ANSI",
    description:
      "IBM 102-key ANSI (1391401 class): 16 continuous vertical paths + 8 horizontal paths on the dotted-membrane layer. Vertical indices from kbupgrade 1391401.matrix; horizontal A..H from modelm-102-key-1391401/ansi-matrix.json (C0..C7). Often compatible with 1391404; verify for your part.",
    schemaVersion: "1.0.0",
    modelVersion: "0.3.7-ribbon-legend-layout",
    supportedFeatures: ["trace_overlay", "ribbon_highlight", "comparison_keys"],
    dataNotes: [
      "Vertical trace paths 1–16: key membership is from kbupgrade 1391401.matrix. That is pathA in the data.",
      "Horizontal trace paths A–H: each key’s C0..C7 in modelm-102-key-1391401/ansi-matrix.json maps to pathB. The file’s (R,C) pairs are not a unique 16×8 table; the generator uses kbupgrade for pathA and column for pathB.",
      "On-screen key positions and trace line segments are schematic, not a measured FFC. Package trace_paths use tail pin points plus key centers in reading order. Replace the package art for a photo-accurate overlay if needed.",
    ],
    files: {
      keys: "keys.yaml",
      traces: "traces.yaml",
      tracePaths: "trace_paths.yaml",
      ribbonContacts: "ribbon_contacts.yaml",
      keyTraceMap: "key_trace_map.yaml",
    },
  };
}

const MODEL_ID = "ibm-1391401-ansi";

function writeYaml(name, data) {
  const doc = new YAML.Document(data);
  fs.writeFileSync(path.join(outDir, name), String(doc), "utf8");
}

fs.mkdirSync(outDir, { recursive: true });
const { byKeyId: dashedByKeyId, metadata: matrixFileMeta } = loadDashedFromMatrixFile();
const keys = buildKeys(MODEL_ID);
const solidMap = buildSolidAssignments();
const traceList = traces(MODEL_ID);
const ribbon = ribbonContacts(MODEL_ID);
const contactById = new Map(ribbon.map((c) => [c.contactId, c]));
const paths = buildTracePaths(MODEL_ID, keys, traceList, solidMap, dashedByKeyId, contactById);
const kmap = buildKeyTraceMap(MODEL_ID, keys, solidMap, dashedByKeyId);

writeYaml("manifest.yaml", manifest(MODEL_ID));
writeYaml("keys.yaml", { keys });
writeYaml("traces.yaml", { traces: traceList });
writeYaml("trace_paths.yaml", { tracePaths: paths });
writeYaml("ribbon_contacts.yaml", { ribbonContacts: ribbon });
writeYaml("key_trace_map.yaml", { keyTraceMap: kmap });

const registryPath = path.join(root, "public", "models", "registry.yaml");
fs.mkdirSync(path.dirname(registryPath), { recursive: true });
fs.writeFileSync(
  registryPath,
  String(
    new YAML.Document({
      models: [{ modelId: MODEL_ID, packagePath: "ibm-1391401-ansi" }],
    }),
  ),
  "utf8",
);

console.log("Wrote model package to", outDir);
if (matrixFileMeta?.model) {
  console.log("Matrix file:", matrixFileMeta.model, matrixFileMeta.description ?? "");
}
console.log("Dashed columns mapped for", dashedByKeyId.size, "keys (fallback for intl_*)");
