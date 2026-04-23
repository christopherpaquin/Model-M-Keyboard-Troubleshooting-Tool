# 102-key ANSI matrix source (1391401 class)

These files drive the **dashed (column) layer** in the generated model package `public/models/ibm-1391401-ansi/`.

- `ansi-matrix.json` — metadata and `matrix` of key label → `[row, column]` with rows `R2`…`R14` and columns `C0`…`C7`.
- `ansi-matrix.csv` — same data in CSV form (optional copy for spreadsheets).

## Important: duplicate `(row, column)` cells

The JSON assigns the same `R#`+`C#` string to more than one key in several places (for example the main block and the numpad). A physical 16×8 matrix has **at most one key per intersection**, so the table cannot be read as a literal unique cell map as written.

The **generator** therefore:

1. Uses **kbupgrade** `1391401.matrix` **row lines** for the **solid** (pathA) trace per key.
2. Uses only the **column** token (`C0`…`C7`) from this file for the **dashed** (pathB) trace, mapped to `dashed_A`…`dashed_H`.

That yields a **unique (solid, dashed) pair** per key even when two keys share the same `R#C#` string in the source file.

If you later produce a file where each key has a **unique** cell, you can extend the generator to validate rows as well; today the `R#` in this file is informational / for cross-checks only (except as noted in the app manifest).
