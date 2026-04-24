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
  euro1: "EUR",
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
};

function R(x, y, w, h) {
  return [x, y + VIEW_TOP_PAD, w, h];
}

function defaultDisplayName(keyId) {
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

  const L = buildGridLayout(keyIds);
  const keys = [];
  for (const keyId of keyIds) {
    const g = L.get(keyId);
    if (!g) {
      throw new Error(`no layout for ${keyId}`);
    }
    const section = keyId.startsWith("kp_") || keyId === "num_lock" || keyId.startsWith("qmk_")
      ? "numpad"
      : keyId.startsWith("f") && /^f\d+$/u.test(keyId)
        ? "function"
        : keyId.startsWith("arrow_") || "insert,home,page_up,page_down,delete,end,nav_center".split(",").includes(keyId)
          ? "navigation"
          : "main";
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

  const traceL = traceListM(opt.modelId, nDashed, nSolid);
  const rib = ribbonN(opt.modelId, nDashed, nSolid);
  const contactById = new Map(rib.map((c) => [c.contactId, c]));
  const tracePaths = buildTracePaths(opt.modelId, keys, traceL, byKey, contactById);

  function writeYaml(n, d) {
    fs.writeFileSync(path.join(outDir, n), String(new YAML.Document(d)), "utf8");
  }

  fs.mkdirSync(outDir, { recursive: true });
  const mVersion = "0.2.0-sharktastica-csv";
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
      "Generated from sharktastica QMK CSV; key positions are a coarse grid—edit keys.yaml to match a photo.",
    ],
    files: {
      keys: "keys.yaml",
      traces: "traces.yaml",
      tracePaths: "trace_paths.yaml",
      ribbonContacts: "ribbon_contacts.yaml",
      keyTraceMap: "key_trace_map.yaml",
    },
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
    csvName: "matrix_ssk.csv",
    modelId: "ibm-m-104-ssk",
    packagePath: "ibm-m-104-ssk",
    displayName: "IBM Model M 104/105 Space Saving Keyboard (SSK) — QMK",
    layoutName: "SSK 104+",
    description: "8×16 QMK scan from sharktastica matrix_ssk.csv; M2 = rows, M1 = columns.",
    dataNote: "SSK: verify against your SSK membrane.",
  },
  {
    csvName: "matrix_pc122.csv",
    modelId: "unicomp-pc-122",
    packagePath: "unicomp-pc-122",
    displayName: "Unicomp PC 122 — QMK (sharktastica)",
    layoutName: "122 PC",
    family: "Unicomp / IBM Class",
    description: "8×16 from matrix_pc122.csv. Extra column keys F21–F24, LB* cluster.",
    dataNote: "PC 122: 8 scan rows, 16 columns; confirm Unicomp revision.",
  },
  {
    csvName: "matrix_endurapro.csv",
    modelId: "unicomp-endurapro",
    packagePath: "unicomp-endurapro",
    displayName: "Unicomp Endurapro (104) — QMK (sharktastica)",
    layoutName: "104",
    family: "Unicomp",
    description: "From matrix_endurapro.csv. Includes hidden-matrix keys (qmk_*) for routing.",
    dataNote: "Endurapro: includes k_bsp_hidden etc. as aux keyIds.",
  },
  {
    csvName: "matrix_converged.csv",
    modelId: "ibm-122-converged",
    packagePath: "ibm-122-converged",
    displayName: "IBM Model M 122 (Converged) — QMK (sharktastica)",
    layoutName: "122 terminal",
    family: "IBM Model M",
    description: "8×20 from matrix_converged.csv. Same as matrix reference used for ibm-122-terminal; duplicate package for CSV-traceability.",
    dataNote: "Canonical 8×20 M122; compare with ibm-122-terminal package.",
  },
  {
    minim: true,
    csvName: "matrix_minim.csv",
    modelId: "unicomp-mini-m",
    packagePath: "unicomp-mini-m",
    displayName: "Unicomp Mini M — sharktastica (display labels → keyId)",
    layoutName: "Mini M",
    family: "Unicomp",
    description: "12×~20 from matrix_minim.csv; keyIds resolved via tools/minimSharkLabels.mjs (not k_* QMK codes).",
    dataNote: "Matrix uses Grv, LShiftHid, FwSlash, etc.; M2=rows, M1=cols in CSV scan order.",
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
