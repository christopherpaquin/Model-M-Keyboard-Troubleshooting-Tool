/**
 * Keycap legend for diagrams: show the symbol/abbreviation a user would see on the key,
 * not internal `keyId` (e.g. digit_1 → "1", kp_slash → "÷" or "/").
 * Falls back to displayName from YAML, then a shortened form of keyId.
 */

const CAP: Record<string, string> = {
  // Row 0
  esc: "Esc",
  // f1–f24: dynamic below
  print_screen: "PrtSc",
  scroll_lock: "ScrLk",
  pause_break: "Pause",
  // Numbers & symbols
  backtick: "`",
  digit_0: "0",
  digit_1: "1",
  digit_2: "2",
  digit_3: "3",
  digit_4: "4",
  digit_5: "5",
  digit_6: "6",
  digit_7: "7",
  digit_8: "8",
  digit_9: "9",
  minus: "-",
  equal: "=",
  backspace: "Bksp",
  // Letters (single)
  a: "A",
  b: "B",
  c: "C",
  d: "D",
  e: "E",
  f: "F",
  g: "G",
  h: "H",
  i: "I",
  j: "J",
  k: "K",
  l: "L",
  m: "M",
  n: "N",
  o: "O",
  p: "P",
  q: "Q",
  r: "R",
  s: "S",
  t: "T",
  u: "U",
  v: "V",
  w: "W",
  x: "X",
  y: "Y",
  z: "Z",
  tab: "Tab",
  caps_lock: "Caps",
  enter_main: "Enter",
  // punctuation / symbols
  bracket_left: "[",
  bracket_right: "]",
  backslash: "\\",
  semicolon: ";",
  quote: "'",
  comma: ",",
  period: ".",
  slash: "/",
  // modifiers
  left_shift: "Shift",
  right_shift: "Shift",
  left_ctrl: "Ctrl",
  right_ctrl: "Ctrl",
  left_alt: "Alt",
  right_alt: "Alt",
  app_menu: "Menu",
  os_left: "Win",
  os_right: "Win",
  lang5_code: "Code",
  space: "",
  // Nav
  insert: "Ins",
  home: "Home",
  page_up: "PgUp",
  page_down: "PgDn",
  delete: "Del",
  end: "End",
  nav_center: "Mid",
  arrow_left: "←",
  arrow_right: "→",
  arrow_up: "↑",
  arrow_down: "↓",
  // 122 extra / ISO
  intl_backslash: "`\n#",
  intl_hash: "#",
  euro1: "€",
  ex1: "EX1",
  ex2: "EX2",
  ex3: "EX3",
  ex4: "EX4",
  ex5: "EX5",
  ex6: "EX6",
  ex7: "EX7",
  ex8: "EX8",
  ex9: "EX9",
  ex10: "EX10",
  // Numpad
  num_lock: "Num",
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
  kp_slash: "/",
  kp_asterisk: "*",
  kp_minus: "-",
  kp_plus: "+",
  kp_decimal: ".",
  kp_enter: "Ent",
  matrix_aux_kp_plus: "﹢",
  matrix_aux_plus: "﹢",
  matrix_aux_bsp: "⌫*",
  matrix_aux_rsh: "⇧*",
  matrix_aux_lsh: "⇧*",
  matrix_aux_kp_0: "0*",
  matrix_aux_kp_plus1: "+*",
  matrix_aux_enter: "⏎*",
  qmk_raw_kp_minus: "-",
};

function fKeyLabel(keyId: string): string | undefined {
  const m = /^f(\d+)$/.exec(keyId);
  if (m) {
    return `F${m[1]}`;
  }
  return undefined;
}

function qmkOrAuxLabel(keyId: string, displayNameFallback: string): string {
  if (keyId.startsWith("qmk_")) {
    const inner = keyId.replace(/^qmk_raw_/, "").replace(/^qmk_/, "");
    const t = inner.replace(/_/g, " ").replace(/\bkp\b/g, "numpad");
    return t.length > 10 ? t.slice(0, 8) + "…" : t;
  }
  if (keyId.startsWith("matrix_aux")) {
    return displayNameFallback.length < 6 ? displayNameFallback : "+*";
  }
  return displayNameFallback;
}

/**
 * @param keyId - internal id (stable in model data)
 * @param displayName - optional YAML displayName; used as fallback
 */
export function keyCapLabel(keyId: string, displayName: string = ""): string {
  const c = CAP[keyId];
  if (c !== undefined) {
    return c;
  }
  const f = fKeyLabel(keyId);
  if (f) {
    return f;
  }
  const d = displayName?.trim() ?? "";
  // Never use verbose YAML text like "Num 7" / "Num -" as the on-key legend when we have a symbol map.
  if (d && /^num\s+\d+$/i.test(d)) {
    // fall through to keyId / CAP
  } else if (
    d &&
    !/^(digit_|kp_|arrow_|left_|right_|caps_|back|num_|qmk_)/.test(d) &&
    !d.includes("digit_")
  ) {
    if (!d.match(/[a-z]+_[a-z]+/) && !/^Num /i.test(d)) {
      return d;
    }
  }
  if (keyId.startsWith("qmk_") || keyId.startsWith("matrix_aux")) {
    return qmkOrAuxLabel(keyId, d || keyId);
  }
  return d || keyId;
}

/**
 * For SVG: split on newline to stack two legends on a key.
 */
export function keyCapLabelLines(keyId: string, displayName: string = ""): string[] {
  const s = keyCapLabel(keyId, displayName);
  return s.includes("\n") ? s.split("\n") : [s];
}
