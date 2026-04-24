/**
 * Build public/models/<packagePath>/ from sharktastica-csv/matrix_*.csv
 * (QMK k_* in grid). pathA = row scan = solid_01..N, pathB = column = dashed_A..
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { parseSharkMatrixCsv } from "./lib/sharkMatrixCsv.mjs";
import { keyIdForQmk } from "./qmkKeyIdMap.mjs";
import { keyIdForMinimSharkLabel } from "./minimSharkLabels.mjs";
import { upsertModelRegistryEntry } from "./model-registry.mjs";
import { buildLayoutIbm122Physical } from "./layout-ibm-122-physical.mjs";
import { buildLayoutIbmSskPhysical } from "./layout-ibm-ssk-physical.mjs";
import { buildLayoutIbmUnicomp104Physical } from "./layout-unicomp-104-physical.mjs";
import { buildLayoutIbmUnicompMinimPhysical } from "./layout-unicomp-minim-physical.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const VIEW_TOP_PAD = 100;

const DISPLAY_EXTRA = {
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
  euro1: "€",
  nav_center: "JUMP",
  print_screen: "PrtSc",
  scroll_lock: "ScrLk",
  pause_break: "Pause",
  esc: "Esc",
  os_left: "Win",
  os_right: "Win",
  app_menu: "Menu",
  lang5_code: "Code",
  matrix_aux_kp_plus: "+*",
  matrix_aux_bsp: "Bsp*",
  matrix_aux_rsh: "Sh*",
  matrix_aux_lsh: "LSh*",
  matrix_aux_enter: "Ent*",
  qmk_raw_kp_minus: "-",
  matrix_aux_kp_plus: "+*",
};

/** keycap text for numpad keys in generated YAML (diagram uses keyCapLabel, which also maps these) */
const NUMPAD_DISPLAY = {
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
  kp_plus: "+",
  kp_minus: "-",
  kp_decimal: ".",
  kp_enter: "Ent",
  qmk_raw_kp_minus: "-",
};

function R(x, y, w, h) {
  return [x, y + VIEW_TOP_PAD, w, h];
}

function defaultDisplayName(keyId) {
  if (NUMPAD_DISPLAY[keyId] !== undefined) {
    return NUMPAD_DISPLAY[keyId];
  }
  if (DISPLAY_EXTRA[keyId]) {
    return DISPLAY_EXTRA[keyId];
  }
  const m = /^f(\d+)$/.exec(keyId);
  if (m) {
    return `F${m[1]}`;
  }
  if (keyId.length === 1) {
    return keyId.toUpperCase();
  }
  if (keyId.startsWith("qmk_")) {
    return keyId.replace(/^qmk_raw_/, "").replace(/_/g, " ").slice(0, 12);
  }
  return keyId;
}

function colId(col) {
  if (col < 0 || col > 25) {
    throw new Error(`max 26 column traces (A..Z), got col ${col}`);
  }
  return `dashed_${String.fromCharCode(65 + col)}`;
}
function rowId(r) {
  return `solid_${String(r + 1).padStart(2, "0")}`;
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

function buildGridLayout(keyIds) {
  const m = new Map();
  const cols = 20;
  const w = 28;
  const h = 28;
  const g = 1;
  keyIds.sort();
  for (let i = 0; i < keyIds.length; i++) {
    const id = keyIds[i];
    const col = i % cols;
    const ro = (i / cols) | 0;
    m.set(id, R(6 + col * (w + g), 4 + ro * (h + g), w, h));
  }
  return m;
}

function ribbonN(modelId, nDashed, nSolid) {
  const contacts = [];
  const y = 32;
  const h = 28;
  const wD = 12;
  const gD = 2;
  const wS = 16;
  const gS = 2;
  const gap = 12;
  let x = 6;
  for (let c = 0; c < nDashed; c++) {
    const letter = String.fromCharCode(65 + c);
    contacts.push({
      modelId,
      contactId: `ribbon_d_${letter}`,
      layerId: "membrane_dashed",
      contactNumber: letter,
      x,
      y,
      width: wD,
      height: h,
      label: `M1 top col ${c}`,
    });
    x += wD + gD;
  }
  x += gap;
  for (let r = 0; r < nSolid; r++) {
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
      label: `M2 bottom row ${num}`,
    });
    x += wS + gS;
  }
  return contacts;
}

function traceListM(modelId, nDashed, nSolid) {
  const t = [];
  for (let c = 0; c < nDashed; c++) {
    const letter = String.fromCharCode(65 + c);
    const tid = colId(c);
    t.push({
      modelId,
      traceId: tid,
      displayName: `Membrane 1 (top) — col ${c} ${letter}`,
      layerId: "membrane_dashed",
      ribbonContactId: `ribbon_d_${letter}`,
    });
  }
  for (let r = 0; r < nSolid; r++) {
    const tid = rowId(r);
    t.push({
      modelId,
      traceId: tid,
      displayName: `Membrane 2 (bottom) — row ${r + 1}`,
      layerId: "membrane_solid",
      ribbonContactId: `ribbon_s_${String(r + 1).padStart(2, "0")}`,
    });
  }
  return t;
}

function buildTracePaths(modelId, keys, traceList, byKey, contactById) {
  const L = Object.fromEntries(keys.map((k) => [k.keyId, [k.x, k.y, k.width, k.height]]));
  const keysByTrace = new Map();
  for (const tr of traceList) {
    keysByTrace.set(tr.traceId, []);
  }
  for (const k of keys) {
    const e = byKey.get(k.keyId);
    if (!e) {
      continue;
    }
    keysByTrace.get(e.s).push(k.keyId);
    keysByTrace.get(e.d).push(k.keyId);
  }
  const paths = [];
  let pid = 0;
  for (const tr of traceList) {
    const kids = [...new Set(keysByTrace.get(tr.traceId) ?? [])];
    const cdef = contactById.get(tr.ribbonContactId);
    if (!cdef) {
      throw new Error(`no ${tr.ribbonContactId}`);
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
    const geometry = polylineThroughPoints([pin, ...centers.slice(0, 50)]);
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

/**
 * @param {object} opt
 * @param {string} opt.csvName - file under sharktastica-csv/
 * @param {string} opt.modelId
 * @param {string} opt.packagePath
 * @param {string} opt.displayName
 * @param {string} opt.subtitle
 * @param {string} opt.dataNote
 * @param {boolean} [opt.minim] - matrix_minim: display labels → keyId
 * @param {boolean} [opt.physicalLayout122] - use shared 122-key 5250 schematic
 * @param {boolean} [opt.physicalLayoutSsk] - 104/105 SSK, no numpad (uses layout-ibm-ssk-physical.mjs)
 * @param {boolean} [opt.physicalLayoutUnicomp104] - Unicomp 104+ full ANSI (layout-unicomp-104-physical.mjs)
 * @param {boolean} [opt.physicalLayoutUnicompMinim] - Unicomp Mini M TKL (layout-unicomp-minim-physical.mjs)
 * @param {string} [opt.modelVersion]
 * @param {string} [opt.subtitle] - if omitted, displayName
 */
function generateOne(opt) {
  const pCsv = path.join(root, "sharktastica-csv", opt.csvName);
  const outDir = path.join(root, "public", "models", opt.packagePath);
  if (!fs.existsSync(pCsv)) {
    throw new Error(`Missing ${pCsv}`);
  }
  const { rows, cols, byQmk } = parseSharkMatrixCsv(fs.readFileSync(pCsv, "utf8"));
  if (opt.expectRows && rows !== opt.expectRows) {
    console.warn(opt.modelId, `row count ${rows} (expected ${opt.expectRows})`);
  }
  if (opt.expectCols && cols !== opt.expectCols) {
    console.warn(opt.modelId, `col count ${cols} (expected ${opt.expectCols})`);
  }

  const nSolid = rows;
  const nDashed = cols;
  const byKey = new Map();

  for (const [qmk, cell] of byQmk) {
    if (opt.minim) {
      const keyId = keyIdForMinimSharkLabel(qmk);
      if (byKey.has(keyId)) {
        throw new Error(`${opt.modelId}: two labels map to keyId ${keyId}`);
      }
      byKey.set(keyId, { qmk, s: rowId(cell.r), d: colId(cell.c) });
      continue;
    }
    if (!qmk.startsWith("k_") && !qmk.startsWith("kp_")) {
      continue;
    }
    const keyId = keyIdForQmk(qmk);
    if (byKey.has(keyId)) {
      console.warn(`${opt.modelId}: skip duplicate keyId ${keyId} (second QMK: ${qmk})`);
      continue;
    }
    byKey.set(keyId, { qmk, s: rowId(cell.r), d: colId(cell.c) });
  }

  const keyIds = [...byKey.keys()].filter((k) => k.length > 0);
  if (keyIds.length === 0) {
    throw new Error("no keys in matrix");
  }

  const grid = buildGridLayout(keyIds);
  const L = opt.physicalLayoutSsk
    ? (() => {
        const o = buildLayoutIbmSskPhysical(keyIds, "ansi");
        const m = new Map();
        for (const id of keyIds) {
          const p = o[id] ?? grid.get(id);
          if (!p) {
            throw new Error(`no SSK physical layout for ${id}`);
          }
          m.set(id, p);
        }
        return m;
      })()
    : opt.physicalLayout122
      ? (() => {
          const o = buildLayoutIbm122Physical(keyIds);
          const m = new Map();
          for (const id of keyIds) {
            const p = o[id] ?? grid.get(id);
            if (!p) {
              throw new Error(`no 122 physical layout for ${id}`);
            }
            m.set(id, p);
          }
          return m;
        })()
      : opt.physicalLayoutUnicomp104
        ? (() => {
            const o = buildLayoutIbmUnicomp104Physical(keyIds);
            const m = new Map();
            for (const id of keyIds) {
              const p = o[id] ?? grid.get(id);
              if (!p) {
                throw new Error(`no Unicomp 104 physical layout for ${id}`);
              }
              m.set(id, p);
            }
            return m;
          })()
        : opt.physicalLayoutUnicompMinim
          ? (() => {
              const o = buildLayoutIbmUnicompMinimPhysical(keyIds);
              const m = new Map();
              for (const id of keyIds) {
                const p = o[id] ?? grid.get(id);
                if (!p) {
                  throw new Error(`no Unicomp Mini M physical layout for ${id}`);
                }
                m.set(id, p);
              }
              return m;
            })()
          : grid;
  const keys = [];
  for (const keyId of keyIds) {
    const g = L.get(keyId);
    if (!g) {
      throw new Error(`no layout for ${keyId}`);
    }
    const section = (() => {
      if (
        keyId === "num_lock" ||
        keyId.startsWith("kp_") ||
        keyId === "qmk_raw_kp_minus" ||
        keyId.startsWith("matrix_aux_kp")
      ) {
        return "numpad";
      }
      if (keyId.startsWith("f") && /^f\d+$/u.test(keyId)) {
        return "function";
      }
      if (
        keyId.startsWith("arrow_") ||
        "insert,home,page_up,page_down,delete,end,nav_center".split(",").includes(keyId)
      ) {
        return "navigation";
      }
      if (/^ex\d+$/u.test(keyId)) {
        return "other";
      }
      return "main";
    })();
    keys.push({
      modelId: opt.modelId,
      keyId,
      displayName: defaultDisplayName(keyId),
      section,
      x: g[0],
      y: g[1],
      width: g[2],
      height: g[3],
    });
  }
  keys.sort((a, b) => a.y * 2000 + a.x - (b.y * 2000 + b.x));
  for (let i = 0; i < keys.length; i++) {
    keys[i].sortOrder = keys[i].y * 2000 + keys[i].x + i;
  }

  let keyLayoutAlternates = null;
  /** @type {typeof keys | null} */
  let keysIso = null;
  if (opt.physicalLayoutSsk) {
    const oIso = buildLayoutIbmSskPhysical(keyIds, "iso");
    const mIso = new Map();
    for (const id of keyIds) {
      const p = oIso[id] ?? grid.get(id);
      if (!p) {
        throw new Error(`no SSK ISO physical layout for ${id}`);
      }
      mIso.set(id, p);
    }
    const ki = keys.map((k) => {
      const g = mIso.get(k.keyId);
      if (!g) {
        throw new Error(`SSK ISO: missing map for key ${k.keyId}`);
      }
      return { ...k, x: g[0], y: g[1], width: g[2], height: g[3] };
    });
    ki.sort((a, b) => a.y * 2000 + a.x - (b.y * 2000 + b.x));
    for (let i = 0; i < ki.length; i++) {
      ki[i].sortOrder = ki[i].y * 2000 + ki[i].x + i;
    }
    keysIso = ki;
    keyLayoutAlternates = [
      { id: "iso-uk", label: "ISO/UK (extra key left of Z)", file: "keys-iso.yaml" },
    ];
  }

  const traceL = traceListM(opt.modelId, nDashed, nSolid);
  const rib = ribbonN(opt.modelId, nDashed, nSolid);
  const contactById = new Map(rib.map((c) => [c.contactId, c]));
  const tracePaths = buildTracePaths(opt.modelId, keys, traceL, byKey, contactById);

  function writeYaml(n, d) {
    fs.writeFileSync(path.join(outDir, n), String(new YAML.Document(d)), "utf8");
  }

  fs.mkdirSync(outDir, { recursive: true });
  const mVersion = opt.modelVersion ?? "0.2.0-matrix-csv";
  const dataNotesSsk =
    "SSK: default on-screen keys are ANSI (US), 104+ no numpad. If your plate has the extra key left of Z, switch to the ISO/UK " +
    "layout in the app (or load keys-iso.yaml). intl_backslash is placed in the overflow when not on the US schematic. " +
    "See tools/layout-ibm-ssk-physical.mjs. Not a scan matrix grid.";

  const manifest = {
    modelId: opt.modelId,
    displayName: opt.displayName,
    family: opt.family ?? "IBM / Unicomp (Model M class)",
    layoutName: opt.layoutName,
    subtitle: opt.subtitle ?? opt.displayName,
    description: opt.description,
    schemaVersion: "1.0.0",
    modelVersion: mVersion,
    supportedFeatures: ["trace_overlay", "ribbon_highlight", "comparison_keys"],
    dataNotes: [
      opt.dataNote,
      opt.physicalLayoutSsk
        ? dataNotesSsk
        : opt.physicalLayout122
          ? "Key positions: 122-key 5250 schematic, shared with ibm-122-terminal (tools/layout-ibm-122-physical.mjs)."
          : opt.physicalLayoutUnicomp104
            ? "Key positions: Unicomp 104+ full ANSI (tools/layout-unicomp-104-physical.mjs) with Win/Menu and numpad, not a scan table grid. Hidden k_*_hidden matrix nodes shown as slivers on the primary key."
            : opt.physicalLayoutUnicompMinim
              ? "Key positions: Unicomp Mini M TKL ANSI (tools/layout-unicomp-minim-physical.mjs), not matrix scan order. LShift/Enter/Backsp/RShift Hid slivers per minimSharkLabels.mjs."
              : "Generated from a QMK community matrix CSV; key positions are a coarse grid—edit keys.yaml to match a photo.",
    ],
    files: {
      keys: "keys.yaml",
      traces: "traces.yaml",
      tracePaths: "trace_paths.yaml",
      ribbonContacts: "ribbon_contacts.yaml",
      keyTraceMap: "key_trace_map.yaml",
    },
    ...(keyLayoutAlternates ? { keyLayoutAlternates } : {}),
  };
  const kmap = (() => {
    const a = [];
    for (const k of keyIds) {
      const p = byKey.get(k);
      if (p) {
        a.push(
          { modelId: opt.modelId, keyId: k, traceId: p.s, role: "pathA" },
          { modelId: opt.modelId, keyId: k, traceId: p.d, role: "pathB" },
        );
      }
    }
    return a;
  })();
  writeYaml("manifest.yaml", manifest);
  writeYaml("keys.yaml", { keys });
  if (keysIso) {
    writeYaml("keys-iso.yaml", { keys: keysIso });
  }
  writeYaml("traces.yaml", { traces: traceL });
  writeYaml("trace_paths.yaml", { tracePaths });
  writeYaml("ribbon_contacts.yaml", { ribbonContacts: rib });
  writeYaml("key_trace_map.yaml", { keyTraceMap: kmap });
  const canvasW = 6 + nDashed * 14 + 12 + nSolid * 18;
  const canvasH = 100 + Math.ceil(keyIds.length / 20) * 30;
  const srcObj = {
    source: `sharktastica-csv/${opt.csvName}`,
    modelId: opt.modelId,
    rows,
    cols,
    canvas: { suggestedViewWidth: Math.max(920, canvasW + 40), suggestedViewHeight: Math.max(400, canvasH) },
    byQmk: Object.fromEntries(
      [...byQmk].map(([, v]) => [
        v.qmk,
        {
          row: v.r,
          col: v.c,
          keyId: opt.minim
            ? keyIdForMinimSharkLabel(v.qmk)
            : keyIdForQmk(v.qmk),
        },
      ]),
    ),
  };
  fs.writeFileSync(path.join(outDir, "source-matrix-cells.json"), JSON.stringify(srcObj, null, 2), "utf8");
  upsertModelRegistryEntry(opt.modelId, opt.packagePath);
  console.log("Wrote", outDir, "keys", keyIds.length, rows, "×", cols);
}

const BUILDS = [
  {
    physicalLayoutSsk: true,
    modelVersion: "0.4.0-ssk-ansi-iso",
    csvName: "matrix_ssk.csv",
    modelId: "ibm-m-104-ssk",
    packagePath: "ibm-m-104-ssk",
    displayName: "IBM Model M 104/105 Space Saving Keyboard (SSK) — QMK",
    layoutName: "SSK 104+",
    family: "IBM Model M",
    description:
      "8×16 QMK matrix (matrix_ssk.csv); SSK, no numpad. On-screen key shapes use a 104+ schematic, not a scan table grid.",
    dataNote: "SSK: verify QMK vs your FFC. Diagram layout matches 104+ reference (not matrix row order).",
  },
  {
    physicalLayout122: true,
    modelVersion: "0.4.0-physical-122",
    csvName: "matrix_pc122.csv",
    modelId: "unicomp-pc-122",
    packagePath: "unicomp-pc-122",
    displayName: "Unicomp PC 122 — QMK",
    layoutName: "122 PC (physical)",
    family: "Unicomp / IBM Class",
    description:
      "8×16 QMK (matrix_pc122.csv). 122-key layout: F1–F24, EX1–10, nav, numpad. On-screen positions follow the 5250/122 schematic (not scan order), same as ibm-122-converged.",
    dataNote: "PC 122: 8×16 matrix; on-screen key shapes use tools/layout-ibm-122-physical.mjs. Confirm to your FFC and QMK build.",
  },
  {
    physicalLayoutUnicomp104: true,
    modelVersion: "0.4.0-physical-104",
    csvName: "matrix_endurapro.csv",
    modelId: "unicomp-endurapro",
    packagePath: "unicomp-endurapro",
    displayName: "Unicomp Endurapro (104) — QMK",
    layoutName: "104 ANSI (physical)",
    family: "Unicomp",
    description:
      "8×16 QMK (matrix_endurapro.csv). On-screen keys use a 104+ ANSI schematic (numpad, nav, Win/Menu), not a scan table grid. Includes k_*_hidden and aux keyIds for routing.",
    dataNote: "Endurapro: k_bsp_hidden, k_rshift_hidden, etc. map to cap slivers; verify FFC to QMK on your board.",
  },
  {
    physicalLayout122: true,
    modelVersion: "0.3.0-physical-122",
    csvName: "matrix_converged.csv",
    modelId: "ibm-122-converged",
    packagePath: "ibm-122-converged",
    displayName: "IBM Model M 122 - Converged (5250)",
    layoutName: "122 converged 5250",
    family: "IBM Model M",
    subtitle: "IBM Model M 122 - Converged (5250) · 8×20 QMK",
    description:
      "8×20 QMK (matrix_converged.csv) — 5250-style matrix; M2=rows, M1=columns. Pair with ibm-122-terminal for the same QMK hand-built package.",
    dataNote: "Converged CSV traceability; on-screen key shape matches 122 layout helper.",
  },
  {
    minim: true,
    physicalLayoutUnicompMinim: true,
    modelVersion: "0.2.0-physical-tkl",
    csvName: "matrix_minim.csv",
    modelId: "unicomp-mini-m",
    packagePath: "unicomp-mini-m",
    displayName: "Unicomp Mini M",
    layoutName: "TKL 87 (physical)",
    family: "Unicomp",
    description:
      "12×~20 from matrix_minim.csv; keyIds from tools/minimSharkLabels.mjs. On-screen layout is TKL ANSI (no numpad), not a scan table grid.",
    dataNote:
      "Grv, LShiftHid, FwSlash, etc. map to keyIds; M2=rows, M1=cols in the CSV. Physical diagram matches 102 schematic minus the numpad; verify to your FFC.",
  },
];

for (const b of BUILDS) {
  try {
    generateOne({ ...b, expectRows: null, expectCols: null });
  } catch (e) {
    console.error("FAIL", b.modelId, e.message);
    process.exitCode = 1;
  }
}

console.log("Done generate-shark-csv-model (registry merged).");
