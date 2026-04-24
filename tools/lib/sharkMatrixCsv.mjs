/**
 * Parse sharktastica /resources/csv/matrix_*.csv (same as kb-matrix.js load_matrix).
 * Returns: { rows, cols, table: string[][], byQmk: Map<string, {r,c}> } — k_* and KC_NO, empty = "".
 */

function splitRow(line) {
  const dataArr = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  for (let j = 0; j < dataArr.length; j++) {
    dataArr[j] = dataArr[j].replace('","', ",").replace(/^"+|"+$/g, "").trim();
  }
  return dataArr;
}

export function parseSharkMatrixCsv(text) {
  const dataArr = text.split(/\r?\n/).filter((l) => l.length > 0);
  const table = [];
  let maxCol = 0;
  for (let i = 0; i < dataArr.length; i++) {
    const row = splitRow(dataArr[i]);
    table[i] = row;
    maxCol = Math.max(maxCol, row.length);
  }
  for (const row of table) {
    while (row.length < maxCol) {
      row.push("");
    }
  }
  const rows = table.length;
  const cols = maxCol;
  const byQmk = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = (table[r][c] || "").trim();
      if (v === "" || v === "XXXXXXX" || v === "KC_NO") {
        continue;
      }
      if (byQmk.has(v)) {
        if (v.startsWith("k_") || v.startsWith("kp_")) {
          console.warn(`[sharkMatrixCsv] duplicate "${v}" at (${r},${c}) — keeping first @ ${JSON.stringify(byQmk.get(v))}`);
        }
        continue;
      }
      byQmk.set(v, { r, c, qmk: v });
    }
  }
  return { rows, cols, table, byQmk };
}
