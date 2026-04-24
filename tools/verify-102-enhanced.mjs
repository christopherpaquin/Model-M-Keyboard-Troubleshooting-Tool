#!/usr/bin/env node
/**
 * Cross-checks modelm-102-key-1391401/ansi-matrix.json (R1–R16, C0–C7) against
 * sharktastica-csv/matrix_enhanced.csv (9×? QMK scan table).
 * The repo uses 16+8 *membrane* lines; the CSV is a 9×Q col QMK *scan* layout — row/column
 * numbers are not 1:1, but the same key should map to a unique (scanRow, scanCol) on one side
 * and (R#, C#) on the FFC model. This script lists coverage and partition overlap, not a byte-identical match.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSharkMatrixCsv } from "./lib/sharkMatrixCsv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const ANSI = path.join(root, "modelm-102-key-1391401", "ansi-matrix.json");
const ENH = path.join(root, "sharktastica-csv", "matrix_enhanced.csv");

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
  "#": "intl_hash",
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

const LABEL_TO_SHARK = {
  ESC: "k_esc",
  F1: "k_f1",
  F2: "k_f2",
  F3: "k_f3",
  F4: "k_f4",
  F5: "k_f5",
  F6: "k_f6",
  F7: "k_f7",
  F8: "k_f8",
  F9: "k_f9",
  F10: "k_f10",
  F11: "k_f11",
  F12: "k_f12",
  PRINT_SCREEN: "k_prscr",
  SCROLL_LOCK: "k_scrl",
  PAUSE: "k_pause",
  "`": "k_tild",
  1: "k_1",
  2: "k_2",
  3: "k_3",
  4: "k_4",
  5: "k_5",
  6: "k_6",
  7: "k_7",
  8: "k_8",
  9: "k_9",
  0: "k_0",
  "-": "k_minus",
  "=": "k_equals",
  BACKSPACE: "k_backspace",
  TAB: "k_tab",
  Q: "k_q",
  W: "k_w",
  E: "k_e",
  R: "k_r",
  T: "k_t",
  Y: "k_y",
  U: "k_u",
  I: "k_i",
  O: "k_o",
  P: "k_p",
  "[": "k_lbrc",
  "]": "k_rbrc",
  "\\": "k_backsl",
  CAPS_LOCK: "k_caps",
  A: "k_a",
  S: "k_s",
  D: "k_d",
  F: "k_f",
  G: "k_g",
  H: "k_h",
  J: "k_j",
  K: "k_k",
  L: "k_l",
  ";": "k_semicolon",
  "'": "k_singlequote",
  ENTER: "k_return",
  "#": "k_nuhs",
  SHIFT_L: "k_lshift",
  Z: "k_z",
  X: "k_x",
  C: "k_c",
  V: "k_v",
  B: "k_b",
  N: "k_n",
  M: "k_m",
  ",": "k_cm",
  ".": "k_period",
  "/": "k_fwslash",
  SHIFT_R: "k_rshift",
  CTRL_L: "k_lctrl",
  ALT_L: "k_lalt",
  SPACE: "k_space",
  ALT_R: "k_ralt",
  CTRL_R: "k_rctrl",
  INSERT: "k_ins",
  DELETE: "k_del",
  HOME: "k_home",
  END: "k_end",
  PAGE_UP: "k_pgup",
  PAGE_DOWN: "k_pgdn",
  ARROW_UP: "k_up",
  ARROW_LEFT: "k_left",
  ARROW_DOWN: "k_down",
  ARROW_RIGHT: "k_right",
  NUM_LOCK: "kp_nl",
  KP_DIVIDE: "kp_div",
  KP_MULTIPLY: "kp_mult",
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
  KP_DECIMAL: "kp_dot",
};

const raw = JSON.parse(fs.readFileSync(ANSI, "utf8"));
const matrix = raw.matrix;
const { byQmk, rows, cols, table: enhTable } = parseSharkMatrixCsv(fs.readFileSync(ENH, "utf8"));

const out = [];
out.push("## 102-key ansi-matrix.json vs sharktastica matrix_enhanced.csv");
out.push("");
out.push(`Enhanced CSV: ${rows} row(s) × ${cols} column(s) (QMK table).`);
out.push("Repo: 16 R1..R16 × 8 C0..C7 (FFC-oriented trace IDs in this tool).");
out.push("");

const both = [];
const missingInCsv = [];
const missingInAnsi = [];

for (const [label, pos] of Object.entries(matrix)) {
  const k = MATRIX_LABEL_TO_KEYID[label];
  const sh = LABEL_TO_SHARK[label];
  if (!sh) {
    missingInCsv.push(label);
    continue;
  }
  if (!byQmk.has(sh)) {
    both.push(
      `NO_CSV: ${label} (keyId ${k}) => expected ${sh} @ ansi ${pos[0]} ${pos[1]}`,
    );
    continue;
  }
  const p = byQmk.get(sh);
  both.push(
    `OK: ${label}  ansi=${pos[0]}${pos[1]}  enhanced_csv=(${p.r},${p.c})  ${sh}`,
  );
}

for (const sh of byQmk.keys()) {
  if (sh === "k_plus_hidden" || sh === "kp_plus_hidden") {
    continue; // numpad ghost in some boards
  }
  const inAnsi = Object.entries(LABEL_TO_SHARK).find(([, v]) => v === sh);
  if (!inAnsi) {
    continue;
  }
  const [lab] = inAnsi;
  if (!matrix[lab]) {
    missingInAnsi.push(`${sh} (label would be ${lab})`);
  }
}
out.push("### Per-key (same logical key, both sources)");
out.push(both.join("\n"));
out.push("");
out.push("### Keys without LABEL_TO_SHARK / excluded");
if (missingInCsv.length) {
  out.push(missingInCsv.join(", ") || "none");
}
out.push("");
out.push("### CSV k_* with no entry in ansi-matrix (after label map)");
if (missingInAnsi.length) {
  out.push(missingInAnsi.slice(0, 20).join("\n"));
} else {
  out.push("—");
}
out.push("");
out.push("### Numpad + ISO note");
out.push("This repo numpad/ISO cells may use R1/R15/R16 assignments that differ from QMK row");
out.push("so FFC uniqueness holds — see modelm-102-key-1391401 README.");

const report = out.join("\n");
console.log(report);
fs.writeFileSync(path.join(root, "modelm-102-key-1391401", "VERIFICATION-vs-sharktastica-enhanced.txt"), report, "utf8");
console.log("\nWrote modelm-102-key-1391401/VERIFICATION-vs-sharktastica-enhanced.txt");
