/**
 * IBM Model M 122-key terminal (8×20 matrix) — "converged" / 5250-style QMK table.
 * - pathA: Membrane 2 (bottom) = scan rows 0..7 → solid_01..solid_08
 * - pathB: Membrane 1 (top) = scan columns 0..19 → dashed_A..dashed_T
 * Source: community keymatrix (e.g. sharktastica M122 simulator / phosphorglow) — verify against your FFC.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { upsertModelRegistryEntry } from "./model-registry.mjs";
import { buildLayoutIbm122Physical } from "./layout-ibm-122-physical.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "models", "ibm-122-terminal");

const MODEL_ID = "ibm-122-terminal";

/* eslint-disable @stylistic/max-len — 8×20 QMK table (one array per row, 20 cells; null = empty) */
const QMK_ROW_COL = [
  [
    "k_lalt",
    "k_space",
    "k_rctrl",
    "k_lshift",
    "k_nubs",
    "k_b",
    "k_n",
    "k_f23",
    "k_f24",
    "k_f12",
    "k_fwslash",
    "kp_0",
    "kp_dot",
    "kp_enter",
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  [
    "k_left",
    "kp_1",
    "k_caps",
    "k_rshift",
    "k_z",
    "k_x",
    "k_c",
    "k_v",
    "k_m",
    "k_f22",
    "k_f10",
    "k_f11",
    "k_cm",
    "k_period",
    "k_nuhs",
    "k_return",
    "kp_2",
    "kp_3",
    null,
    null,
  ],
  [
    "k_lb5",
    "k_lb6",
    "k_t",
    "k_y",
    "k_f20",
    "k_f21",
    "k_f9",
    "k_rbrc",
    "k_lbrc",
    "k_backsl",
    "k_end",
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  [
    "kp_plus",
    "k_lb4",
    "k_tab",
    "k_q",
    "k_w",
    "k_e",
    "k_r",
    "k_u",
    "k_f19",
    "k_f7",
    "k_f8",
    "k_i",
    "k_o",
    "k_p",
    "kp_7",
    "k_pgdn",
    "kp_8",
    "kp_9",
    null,
    null,
  ],
  [
    "k_lb1",
    "k_lb2",
    "k_tild",
    "k_5",
    "k_6",
    "k_f17",
    "k_f18",
    "k_f6",
    "k_equals",
    "k_minus",
    "k_backspace",
    "k_ins",
    "k_home",
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  [
    "kp_minus",
    "k_lb3",
    "k_1",
    "k_2",
    "k_3",
    "k_4",
    "k_7",
    "k_f16",
    "k_f4",
    "k_f5",
    "k_8",
    "k_9",
    "k_0",
    "kp_nl",
    "k_pgup",
    "kp_div",
    "kp_mult",
    null,
    null,
    null,
  ],
  [
    "kp_plus_hidden",
    "k_lb7",
    "k_lb8",
    "k_a",
    "k_s",
    "k_d",
    "k_f",
    "k_j",
    "k_f14",
    "k_f15",
    "k_f3",
    "k_k",
    "k_l",
    "k_semicolon",
    "kp_4",
    "k_del",
    "kp_5",
    "kp_6",
    "k_right",
    null,
  ],
  [
    "k_lctrl",
    "k_lb9",
    "k_lb10",
    "k_ralt",
    "k_g",
    "k_h",
    "k_f13",
    "k_f1",
    "k_f2",
    "k_singlequote",
    "k_down",
    "k_up",
    "k_navmid",
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
];

const QMK_TO_KEYID = {
  k_lalt: "left_alt",
  k_ralt: "right_alt",
  k_space: "space",
  k_lctrl: "left_ctrl",
  k_rctrl: "right_ctrl",
  k_lshift: "left_shift",
  k_rshift: "right_shift",
  k_caps: "caps_lock",
  k_tab: "tab",
  k_backspace: "backspace",
  k_backsl: "backslash",
  k_tild: "backtick",
  k_q: "q",
  k_w: "w",
  k_e: "e",
  k_r: "r",
  k_t: "t",
  k_y: "y",
  k_u: "u",
  k_i: "i",
  k_o: "o",
  k_p: "p",
  k_lbrc: "bracket_left",
  k_rbrc: "bracket_right",
  k_a: "a",
  k_s: "s",
  k_d: "d",
  k_f: "f",
  k_g: "g",
  k_h: "h",
  k_j: "j",
  k_k: "k",
  k_l: "l",
  k_semicolon: "semicolon",
  k_singlequote: "quote",
  k_z: "z",
  k_x: "x",
  k_c: "c",
  k_v: "v",
  k_b: "b",
  k_n: "n",
  k_m: "m",
  k_cm: "comma",
  k_period: "period",
  k_nuhs: "intl_backslash",
  k_equals: "equal",
  k_minus: "minus",
  k_1: "digit_1",
  k_2: "digit_2",
  k_3: "digit_3",
  k_4: "digit_4",
  k_5: "digit_5",
  k_6: "digit_6",
  k_7: "digit_7",
  k_8: "digit_8",
  k_9: "digit_9",
  k_0: "digit_0",
  k_f1: "f1",
  k_f2: "f2",
  k_f3: "f3",
  k_f4: "f4",
  k_f5: "f5",
  k_f6: "f6",
  k_f7: "f7",
  k_f8: "f8",
  k_f9: "f9",
  k_f10: "f10",
  k_f11: "f11",
  k_f12: "f12",
  k_f13: "f13",
  k_f14: "f14",
  k_f15: "f15",
  k_f16: "f16",
  k_f17: "f17",
  k_f18: "f18",
  k_f19: "f19",
  k_f20: "f20",
  k_f21: "f21",
  k_f22: "f22",
  k_f23: "f23",
  k_f24: "f24",
  k_lb1: "ex1",
  k_lb2: "ex2",
  k_lb3: "ex3",
  k_lb4: "ex4",
  k_lb5: "ex5",
  k_lb6: "ex6",
  k_lb7: "ex7",
  k_lb8: "ex8",
  k_lb9: "ex9",
  k_lb10: "ex10",
  k_left: "arrow_left",
  k_right: "arrow_right",
  k_up: "arrow_up",
  k_down: "arrow_down",
  k_ins: "insert",
  k_del: "delete",
  k_home: "home",
  k_end: "end",
  k_pgup: "page_up",
  k_pgdn: "page_down",
  k_return: "enter_main",
  k_navmid: "nav_center",
  k_fwslash: "slash",
  k_nubs: "euro1",
  kp_0: "kp_0",
  kp_1: "kp_1",
  kp_2: "kp_2",
  kp_3: "kp_3",
  kp_4: "kp_4",
  kp_5: "kp_5",
  kp_6: "kp_6",
  kp_7: "kp_7",
  kp_8: "kp_8",
  kp_9: "kp_9",
  kp_dot: "kp_decimal",
  kp_nl: "num_lock",
  kp_enter: "kp_enter",
  kp_plus: "kp_plus",
  kp_plus_hidden: "matrix_aux_plus",
  kp_minus: "kp_minus",
  kp_div: "kp_slash",
  kp_mult: "kp_asterisk",
};

const DISPLAY = {
  left_alt: "Alt",
  right_alt: "Alt",
  space: "Space",
  left_ctrl: "Ctrl",
  right_ctrl: "Ctrl",
  left_shift: "Shift",
  right_shift: "Shift",
  caps_lock: "Caps",
  tab: "Tab",
  backspace: "Bksp",
  backslash: "\\",
  backtick: "`",
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
  intl_backslash: "#\n`",
  euro1: "EUR",
  nav_center: "JUMP",
  matrix_aux_plus: "+*",
  enter_main: "Enter",
  num_lock: "Num",
  kp_slash: "/",
  kp_asterisk: "*",
  slash: "/",
  insert: "Ins",
  home: "Home",
  page_up: "PgUp",
  page_down: "PgDn",
  end: "End",
  delete: "Del",
  arrow_left: "←",
  arrow_right: "→",
  arrow_up: "↑",
  arrow_down: "↓",
};

const SECTION = {
  ex: new Set(
    "ex1 ex2 ex3 ex4 ex5 ex6 ex7 ex8 ex9 ex10".split(" "),
  ),
};

function sectionFor(keyId) {
  if (SECTION.ex.has(keyId)) return "other";
  if (keyId.startsWith("f") && /^f\d+$/.test(keyId)) return "function";
  if (keyId.startsWith("kp_") || keyId === "num_lock" || keyId === "matrix_aux_plus") return "numpad";
  if (keyId.startsWith("arrow_") || "insert,home,page_up,page_down,delete,end,nav_center".split(",").includes(keyId)) {
    return "navigation";
  }
  return "main";
}

function colToDashed(col) {
  if (col < 0 || col > 19) throw new Error(`col out of range: ${col}`);
  const letter = String.fromCharCode(65 + col);
  return `dashed_${letter}`;
}

function rowToSolid(row) {
  if (row < 0 || row > 7) throw new Error(`row out of range: ${row}`);
  return `solid_${String(row + 1).padStart(2, "0")}`;
}

/**
 * @returns {Map<string, {row:number, col:number}>} keyId -> cell
 */
function buildMatrixMap() {
  const m = new Map();
  for (let r = 0; r < 8; r++) {
    const line = QMK_ROW_COL[r];
    if (!line || line.length !== 20) {
      throw new Error(`Row ${r} must have 20 cells`);
    }
    for (let c = 0; c < 20; c++) {
      const qmk = line[c];
      if (qmk == null) {
        continue;
      }
      const keyId = QMK_TO_KEYID[qmk];
      if (!keyId) {
        throw new Error(`No QMK_TO_KEYID for: ${qmk}`);
      }
      if (m.has(keyId)) {
        throw new Error(
          `Duplicate matrix cell for keyId ${keyId} — ${qmk} and existing at ${JSON.stringify(m.get(keyId))}`,
        );
      }
      m.set(keyId, { row: r, col: c, qmk });
    }
  }
  return m;
}

function buildSolidDashed(m) {
  const solidByKeyId = new Map();
  const dashedByKeyId = new Map();
  for (const [keyId, cell] of m) {
    solidByKeyId.set(keyId, rowToSolid(cell.row));
    dashedByKeyId.set(keyId, colToDashed(cell.col));
  }
  return { solidByKeyId, dashedByKeyId };
}

function recognitionRank(keyId) {
  const ex = "space,enter_main,backspace,left_shift,digit_1,digit_2,q,a,z,kp_5";
  if (ex.split(",").includes(keyId)) {
    return 10;
  }
  if (keyId.startsWith("f")) {
    return 5;
  }
  return 3;
}

function buildKeys(modelId, keyIds, layout) {
  const out = [];
  for (const keyId of keyIds) {
    const g = layout[keyId];
    if (!g) {
      throw new Error(`Missing layout for keyId: ${keyId}`);
    }
    out.push({
      modelId,
      keyId,
      displayName:
        DISPLAY[keyId] ??
        (() => {
          const m = /^f(\d+)$/.exec(keyId);
          if (m) {
            return `F${m[1]}`;
          }
          return keyId.length === 1 ? keyId.toUpperCase() : keyId;
        })(),
      section: sectionFor(keyId),
      x: g[0],
      y: g[1],
      width: g[2],
      height: g[3],
      recognitionRank: recognitionRank(keyId),
    });
  }
  for (let i = 0; i < out.length; i++) {
    out[i].sortOrder = out[i].y * 2000 + out[i].x + i;
  }
  return out;
}

function buildKeyTraceMap(modelId, keyIds, solidByKeyId, dashedByKeyId) {
  const rows = [];
  for (const keyId of keyIds) {
    const solid = solidByKeyId.get(keyId);
    const dashed = dashedByKeyId.get(keyId);
    if (!solid || !dashed) {
      throw new Error(`trace missing for ${keyId}`);
    }
    rows.push(
      { modelId, keyId, traceId: solid, role: "pathA" },
      { modelId, keyId, traceId: dashed, role: "pathB" },
    );
  }
  return rows;
}

function ribbonContactsM122(modelId) {
  const contacts = [];
  const y = 32;
  const h = 30;
  const wDash = 14;
  const gD = 2;
  const wS = 18;
  const gS = 2;
  const innerGap = 20;
  let x = 6;
  for (let c = 0; c < 20; c++) {
    const letter = String.fromCharCode(65 + c);
    contacts.push({
      modelId,
      contactId: `ribbon_d_${letter}`,
      layerId: "membrane_dashed",
      contactNumber: letter,
      x,
      y,
      width: wDash,
      height: h,
      label: `M1 top — col ${c} (${letter})`,
    });
    x += wDash + gD;
  }
  x += innerGap;
  for (let r = 0; r < 8; r++) {
    const num = r + 1;
    const id2 = `ribbon_s_${String(num).padStart(2, "0")}`;
    contacts.push({
      modelId,
      contactId: id2,
      layerId: "membrane_solid",
      contactNumber: String(num),
      x,
      y,
      width: wS,
      height: h,
      label: `M2 bottom — row ${num}`,
    });
    x += wS + gS;
  }
  return contacts;
}

function tracesM122(modelId) {
  const t = [];
  for (let c = 0; c < 20; c++) {
    const letter = String.fromCharCode(65 + c);
    const tid = `dashed_${letter}`;
    t.push({
      modelId,
      traceId: tid,
      displayName: `Membrane 1 (top) — col ${c} ${letter}`,
      layerId: "membrane_dashed",
      ribbonContactId: `ribbon_d_${letter}`,
      description: `8×20 matrix: column index ${c} (tail pad ${letter} of 0–9,A–J). pathB`,
    });
  }
  for (let r = 0; r < 8; r++) {
    const n = r + 1;
    const tid = `solid_${String(n).padStart(2, "0")}`;
    t.push({
      modelId,
      traceId: tid,
      displayName: `Membrane 2 (bottom) — row line ${n}`,
      layerId: "membrane_solid",
      ribbonContactId: `ribbon_s_${String(n).padStart(2, "0")}`,
      description: `8×20 matrix: row index ${r} (tail pin ${8 - r} or B5…D4 per your harness). pathA`,
    });
  }
  return t;
}

function polylineThroughPoints(points) {
  if (points.length === 0) {
    return "M 0 0";
  }
  const [x0, y0] = points[0];
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`;
  }
  return d;
}

function buildTracePaths(modelId, keys, traceList, solidByKeyId, dashedByKeyId, contactById) {
  const keysByTrace = new Map();
  for (const tr of traceList) {
    keysByTrace.set(tr.traceId, []);
  }
  const L = Object.fromEntries(keys.map((k) => [k.keyId, [k.x, k.y, k.width, k.height]]));
  for (const k of keys) {
    const s = solidByKeyId.get(k.keyId);
    const d = dashedByKeyId.get(k.keyId);
    if (!s || !d) {
      throw new Error("buildTracePaths");
    }
    keysByTrace.get(s).push(k.keyId);
    keysByTrace.get(d).push(k.keyId);
  }
  const paths = [];
  let pid = 0;
  for (const tr of traceList) {
    const kids = [...new Set(keysByTrace.get(tr.traceId) ?? [])];
    const cdef = contactById.get(tr.ribbonContactId);
    if (!cdef) {
      throw new Error(`No contact ${tr.ribbonContactId}`);
    }
    const pin = [cdef.x + cdef.width / 2, cdef.y + cdef.height / 2];
    const centers = kids
      .map((id) => {
        const g = L[id];
        if (!g) {
          return null;
        }
        return [g[0] + g[2] / 2, g[1] + g[3] / 2];
      })
      .filter((p) => p != null);
    centers.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const geometry = polylineThroughPoints([pin, ...centers.slice(0, 40)]);
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

function manifest122() {
  const displayName = "IBM Model M 122-key (terminal / converged class)";
  const layoutName = "122-key terminal";
  const modelVersion = "0.1.0-m122-qmk-table";
  return {
    modelId: MODEL_ID,
    displayName,
    family: "IBM Model M",
    layoutName,
    subtitle: `${displayName} · ${modelVersion} · 8×20 matrix`,
    description: `8 rows × 20 columns (0–7 / 0–J) per M122 “converged” style table; Membrane2 = row scan (8 lines), Membrane1 = column scan (20 lines). Re-verify the matrix and FFC for your part.`,
    schemaVersion: "1.0.0",
    modelVersion,
    supportedFeatures: ["trace_overlay", "ribbon_highlight", "comparison_keys"],
    dataNotes: [
      "QMK-style 8×20 table from the community 122 (5250) matrix — not a substitute for an OEM sheet on your FFC.",
      "pathA / solid = row side (8), pathB / dashed = column side (20).",
      "Diagram positions are schematic; nudge keys.yaml after visual check.",
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

const matrix = buildMatrixMap();
const { solidByKeyId, dashedByKeyId } = buildSolidDashed(matrix);
const keyIds = [...matrix.keys()].sort();
const LAYOUT_122b = buildLayoutIbm122Physical(keyIds);

function writeYaml(name, data) {
  const doc = new YAML.Document(data);
  fs.writeFileSync(path.join(outDir, name), String(doc), "utf8");
}

fs.mkdirSync(outDir, { recursive: true });
const keys = buildKeys(MODEL_ID, keyIds, LAYOUT_122b);
const traceList = tracesM122(MODEL_ID);
const ribbon = ribbonContactsM122(MODEL_ID);
const contactById = new Map(ribbon.map((c) => [c.contactId, c]));
const paths = buildTracePaths(
  MODEL_ID,
  keys,
  traceList,
  solidByKeyId,
  dashedByKeyId,
  contactById,
);
const kmap = buildKeyTraceMap(MODEL_ID, keyIds, solidByKeyId, dashedByKeyId);

const pairToKey = new Map();
for (const k of keys) {
  const s = solidByKeyId.get(k.keyId);
  const d = dashedByKeyId.get(k.keyId);
  if (!s || !d) {
    continue;
  }
  const label = `${s} + ${d}`;
  if (pairToKey.has(label)) {
    throw new Error(`Non-unique pair ${label}: ${pairToKey.get(label)} vs ${k.keyId}`);
  }
  pairToKey.set(label, k.keyId);
}

writeYaml("manifest.yaml", manifest122());
writeYaml("keys.yaml", { keys });
writeYaml("traces.yaml", { traces: traceList });
writeYaml("trace_paths.yaml", { tracePaths: paths });
writeYaml("ribbon_contacts.yaml", { ribbonContacts: ribbon });
writeYaml("key_trace_map.yaml", { keyTraceMap: kmap });

const matrixSrcDir = path.join(root, "modelm-122-terminal");
fs.mkdirSync(matrixSrcDir, { recursive: true });
fs.writeFileSync(
  path.join(matrixSrcDir, "m122-source-matrix.json"),
  JSON.stringify(
    {
      metadata: {
        model: "IBM Model M 122 8x20 (QMK / converged reference)",
        rows: 8,
        columns: 20,
        note: "keyId and row/col; verify against FFC",
      },
      keyCells: Object.fromEntries(
        [...matrix.entries()].map(([k, v]) => [k, { row: v.row, col: v.col, qmk: v.qmk }]),
      ),
    },
    null,
    2,
  ),
  "utf8",
);
upsertModelRegistryEntry(MODEL_ID, "ibm-122-terminal");

console.log("M122: wrote", keyIds.length, "keys to", outDir);
console.log("Traces: 20 col + 8 row = 28. Unique pairs ok.");
