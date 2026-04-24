# IBM Model M 122-key (8×20) matrix source

This folder holds the machine-readable cell list produced by `tools/generate-m122-package.mjs`:

- `m122-source-matrix.json` — `keyId` → `{ row, col, qmk }` (row 0..7, column 0..19) from the 8×20 “converged / 5250” style table.

The web package is written to `public/models/ibm-122-terminal/`. Regenerate after edits:

```bash
npm run generate:model:122
```

**Verify** the table against your membrane / part number; the 122 FFC and harness naming can differ. One extra matrix position may exist vs 122 keycaps (e.g. a matrix-only pad).
