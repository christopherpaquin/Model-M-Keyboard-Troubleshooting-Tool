# 102-key ANSI matrix source (1391401 class)

This folder provides `ansi-matrix.json` (and a CSV copy) for the model package in `public/models/ibm-1391401-ansi/`.

- **Each key** maps to a **unique** `["R#","C#"]` cell.
- **R1..R16** map to **Membrane 2 (bottom)** — numbered traces **1..16** in the app.
- **C0..C7** map to **Membrane 1 (top)** — lettered traces **A..H** in the app.
- A few **numpad** keys that previously shared a cell with the main block were moved to **R1** and **R15** in this repository so the table stays 1:1. **Re-verify against your FFC and controller** before high-stakes repairs.

`#` in JSON is the ISO “number sign” / `#` key (`intl_hash` in the UI layout) when the layout includes it.

See `tools/generate-1391401-package.mjs` (`MATRIX_LABEL_TO_KEYID`, `rowTokenToSolid`, `colTokenToDashed`) and `dataNotes` in the generated `manifest.yaml`.
