/**
 * Generates YAML model files for IBM 1391401 102-key ANSI.
 * - pathA (membrane 2, bottom, numbered 1–16 / solid_*): matrix row R1..R16 → `solid_01`..`solid_16`
 * - pathB (membrane 1, top, lettered A–H / dashed_*): column C0..C7 → `dashed_A`..`H`
 * Each key uses one unique (R# C#) cell in `modelm-102-key-1391401/ansi-matrix.json`.
 * Verify that file against your hardware; reassign numpad rows in the JSON if it differs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { upsertModelRegistryEntry } from "./model-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "models", "ibm-1391401-ansi");
const MATRIX_JSON = path.join(root, "modelm-102-key-1391401", "ansi-matrix.json");

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
  /**
   * System keys: 36w; x aligned with `insert` / `home` / `page_up` (nav column) so Prt/Scr/Pause read as stacked above.
   */
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
  /** After `slash` to x=496; 500–626 clears nav (Insert 630). */
  right_shift: [500, 236, 126, 36],
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
  /**
   * Numpad: top row (Num, /, *, -) y-aligned with `insert` / `home` / `page_up` (y=104, h=36).
   * Stacked data rows h=36 with 0px gap; “+” / “Enter” h=72 = two rows (sits flush under prior row).
   */
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

function colTokenToDashed(c) {
  const m = /^C([0-7])$/.exec(c);
  if (!m) throw new Error(`Invalid column token: ${c}`);
  return `dashed_${String.fromCharCode(65 + parseInt(m[1], 10))}`;
}

function rowTokenToSolid(r) {
  const m = /^R([0-9]+)$/.exec(r);
  if (!m) throw new Error(`Invalid row token: ${r}`);
  const n = parseInt(m[1], 10);
  if (n < 1 || n > 16) throw new Error(`Row out of range 1..16: ${r}`);
  return `solid_${String(n).padStart(2, "0")}`;
}

/**
 * @returns {{ solidByKeyId: Map<string, string>, dashedByKeyId: Map<string, string>, metadata: unknown, ignoredLabels: string[] }}
 */
function loadMatrixTraces() {
  if (!fs.existsSync(MATRIX_JSON)) {
    throw new Error(`Missing matrix file: ${MATRIX_JSON}`);
  }
  const raw = JSON.parse(fs.readFileSync(MATRIX_JSON, "utf8"));
  const solidByKeyId = new Map();
  const dashedByKeyId = new Map();
  const ignoredLabels = [];
  for (const [label, pair] of Object.entries(raw.matrix ?? {})) {
    const keyId = MATRIX_LABEL_TO_KEYID[label];
    if (!keyId) {
      ignoredLabels.push(label);
      continue;
    }
    if (!Array.isArray(pair) || pair.length < 2) {
      throw new Error(`Bad matrix cell for ${label}: ${JSON.stringify(pair)}`);
    }
    const [r, c] = pair;
    solidByKeyId.set(keyId, rowTokenToSolid(r));
    dashedByKeyId.set(keyId, colTokenToDashed(c));
  }
  return { solidByKeyId, dashedByKeyId, metadata: raw.metadata, ignoredLabels };
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

function buildKeyTraceMap(modelId, keys, solidByKeyId, dashedByKeyId) {
  const rows = [];
  for (const k of keys) {
    const solid = solidByKeyId.get(k.keyId);
    const dashed = dashedByKeyId.get(k.keyId);
    if (!solid) {
      throw new Error(
        `No matrix row for keyId "${k.keyId}" — add it to modelm-102-key-1391401/ansi-matrix.json and MATRIX_LABEL_TO_KEYID`,
      );
    }
    if (!dashed) {
      throw new Error(
        `No matrix column for keyId "${k.keyId}" — add it to modelm-102-key-1391401/ansi-matrix.json and MATRIX_LABEL_TO_KEYID`,
      );
    }
    rows.push(
      { modelId, keyId: k.keyId, traceId: solid, role: "pathA" },
      { modelId, keyId: k.keyId, traceId: dashed, role: "pathB" },
    );
  }
  return rows;
}

/**
 * Pin boxes in the same 920px-wide space as the keyboard (see `SvgRibbonGutter` in the app; keep in sync).
 * Left group: Membrane 1 (top) — lettered A..H. Right group: Membrane 2 (bottom) — numbered 1..16.
 */
function ribbonContacts(modelId) {
  const contacts = [];
  const y = 32;
  const h = 32;
  const wSolid = 24;
  const gSolid = 4;
  const wDash = 28;
  const gDash = 6;
  const gapBetweenBands = 16;
  const m1StartX = 8;
  for (let i = 0; i < 8; i++) {
    const letter = String.fromCharCode("A".charCodeAt(0) + i);
    const id = `ribbon_d_${letter}`;
    const x = m1StartX + i * (wDash + gDash);
    contacts.push({
      modelId,
      contactId: id,
      layerId: "membrane_dashed",
      contactNumber: letter,
      x,
      y,
      width: wDash,
      height: h,
      label: `Membrane 1 (top) — trace ${letter}`,
    });
  }
  const m1End = m1StartX + 8 * (wDash + gDash) - gDash;
  const m2StartX = m1End + gapBetweenBands;
  for (let i = 1; i <= 16; i++) {
    const id = `ribbon_s_${String(i).padStart(2, "0")}`;
    const x = m2StartX + (i - 1) * (wSolid + gSolid);
    contacts.push({
      modelId,
      contactId: id,
      layerId: "membrane_solid",
      contactNumber: String(i),
      x,
      y,
      width: wSolid,
      height: h,
      label: `Membrane 2 (bottom) — trace ${i}`,
    });
  }
  return contacts;
}

function traces(modelId) {
  const t = [];
  for (let i = 0; i < 8; i++) {
    const letter = String.fromCharCode("A".charCodeAt(0) + i);
    const tid = `dashed_${letter}`;
    t.push({
      modelId,
      traceId: tid,
      displayName: `Membrane 1 (top) — ${letter}`,
      layerId: "membrane_dashed",
      ribbonContactId: `ribbon_d_${letter}`,
      description: `Top membrane (lettered path ${letter} of 8; matrix column C${i} in ansi-matrix.json, pathB).`,
    });
  }
  for (let i = 1; i <= 16; i++) {
    const tid = `solid_${String(i).padStart(2, "0")}`;
    t.push({
      modelId,
      traceId: tid,
      displayName: `Membrane 2 (bottom) — ${i}`,
      layerId: "membrane_solid",
      ribbonContactId: `ribbon_s_${String(i).padStart(2, "0")}`,
      description: `Bottom membrane (numbered path ${i} of 16; matrix row R${i} in ansi-matrix.json, pathA).`,
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

function buildTracePaths(modelId, keys, tracesList, solidByKeyId, dashedByKeyId, contactById) {
  /** @type {Map<string, string[]>} */
  const keysByTrace = new Map();
  for (const tr of tracesList) keysByTrace.set(tr.traceId, []);
  for (const k of keys) {
    const s = solidByKeyId.get(k.keyId);
    const d = dashedByKeyId.get(k.keyId);
    if (!s || !d) throw new Error(`buildTracePaths: missing matrix for ${k.keyId}`);
    keysByTrace.get(s)?.push(k.keyId);
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
  const displayName = "IBM Model M 102-key ANSI (1391401 / 1391404 class)";
  const layoutName = "102-key ANSI";
  const modelVersion = "0.4.1-membrane-naming";
  return {
    modelId,
    displayName,
    family: "IBM Model M",
    layoutName,
    subtitle: `${displayName} · ${modelVersion} · ${layoutName}`,
    description:
      "IBM 102-key ANSI (1391401 class): each key is one (R,C) in modelm-102-key-1391401/ansi-matrix.json — R1..R16 → Membrane 2 (bottom) traces 1..16, C0..C7 → Membrane 1 (top) A..H. Often compatible with 1391404; verify the matrix for your part.",
    schemaVersion: "1.0.0",
    modelVersion,
    supportedFeatures: ["trace_overlay", "ribbon_highlight", "comparison_keys"],
    dataNotes: [
      "pathA / Membrane 2 (bottom, numbered 1..16) = matrix rows R1..R16. pathB / Membrane 1 (top, lettered A..H) = matrix columns C0..C7. Every key has a unique (R,C) in ansi-matrix.json.",
      "Numpad rows in the JSON were reserved so cells stay unique; confirm against your FFC before repairs.",
      "Schematic on-screen key positions and polylines are for navigation; not photo-accurate to the FFC shape.",
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
const { solidByKeyId, dashedByKeyId, metadata: matrixFileMeta, ignoredLabels } = loadMatrixTraces();
if (ignoredLabels.length > 0) {
  console.warn("Matrix labels with no keyId in MATRIX_LABEL_TO_KEYID (ignored):", ignoredLabels.join(", "));
}
const keys = buildKeys(MODEL_ID);
const traceList = traces(MODEL_ID);
const ribbon = ribbonContacts(MODEL_ID);
const contactById = new Map(ribbon.map((c) => [c.contactId, c]));
const paths = buildTracePaths(MODEL_ID, keys, traceList, solidByKeyId, dashedByKeyId, contactById);
const kmap = buildKeyTraceMap(MODEL_ID, keys, solidByKeyId, dashedByKeyId);

/** (solid, dashed) pairs are unique for troubleshooting. */
const pairToKey = new Map();
for (const k of keys) {
  const s = solidByKeyId.get(k.keyId);
  const d = dashedByKeyId.get(k.keyId);
  if (!s || !d) continue;
  const label = `${s} + ${d}`;
  if (pairToKey.has(label)) {
    throw new Error(
      `Non-unique (row,column) mapping: keys "${pairToKey.get(label)}" and "${k.keyId}" both map to ${label}`,
    );
  }
  pairToKey.set(label, k.keyId);
}

writeYaml("manifest.yaml", manifest(MODEL_ID));
writeYaml("keys.yaml", { keys });
writeYaml("traces.yaml", { traces: traceList });
writeYaml("trace_paths.yaml", { tracePaths: paths });
writeYaml("ribbon_contacts.yaml", { ribbonContacts: ribbon });
writeYaml("key_trace_map.yaml", { keyTraceMap: kmap });

upsertModelRegistryEntry(MODEL_ID, "ibm-1391401-ansi");

console.log("Wrote model package to", outDir);
if (matrixFileMeta?.model) {
  console.log("Matrix file:", matrixFileMeta.model, matrixFileMeta.description ?? "");
}
console.log("Matrix: solid + dashed for", solidByKeyId.size, "keys; unique (pathA, pathB) pairs checked.");
