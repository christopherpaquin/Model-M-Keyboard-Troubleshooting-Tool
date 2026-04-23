# Model M keyboard dead-key troubleshooting (local web app)

Desktop-first **static** web app: it loads keyboard **model packages** (YAML) from the browser, draws an **SVG** layout, overlays **vertical** and **horizontal** membrane trace paths, and offers plain-language **troubleshooting** hints. There is no cloud, database, or backend in v1—everything runs in the browser with files under `public/models/`.

---

## Table of contents

- [Prerequisites](#prerequisites)
- [Run on your local Linux machine (development)](#run-on-your-local-linux-machine-development)
- [Build and deploy locally (production-style)](#build-and-deploy-locally-production-style)
- [Using the web interface](#using-the-web-interface)
- [How the data is structured](#how-the-data-is-structured)
- [Add a new Model M (or Unicomp-style) model](#add-a-new-model-m-or-unicomp-style-model)
- [The bundled 102-key ANSI (1391401) sample](#the-bundled-102-key-ansi-1391401-sample)
- [Validation](#validation)
- [Project layout](#project-layout)
- [Assumptions and limitations](#assumptions-and-limitations)
- [License](#license)

---

## Prerequisites

- **Node.js 20+** and **npm** (bundled with Node, or use your distro’s `nodejs` package).
- A **desktop web browser** (Chromium, Firefox, or similar).
- **Git** (only if you are cloning the repository from version control).

### Example: Fedora / RHEL family

```bash
sudo dnf install nodejs git
node --version   # should be v20 or newer
```

### Example: Debian / Ubuntu

```bash
sudo apt update
sudo apt install nodejs npm git
node --version
```

If your distribution ships an older Node, install Node 20+ from [NodeSource](https://github.com/nodesource/distributions) or [fnm](https://github.com/Schniz/fnm) / [nvm](https://github.com/nvm-sh/nvm) before running this project.

---

## Run on your local Linux machine (development)

1. **Get the project** (clone, or extract an archive) and open a terminal in the project root (the directory that contains `package.json`).

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the Vite dev server:**

   ```bash
   npm run dev
   ```

4. In the terminal output, open the URL shown (by default [http://127.0.0.1:5173](http://127.0.0.1:5173)) in your browser. The dev server **reloads** when you edit source or model YAML in `public/`.

5. **Optional quality checks (same as CI):**

   ```bash
   npm run build   # TypeScript + production bundle
   npm run lint    # ESLint
   ```

---

## Build and deploy locally (production-style)

1. **Produce a static site** (output goes to `dist/`):

   ```bash
   npm run build
   ```

2. **Serve `dist/`** with any static file server. Vite copies everything from `public/` to `site root` in the build, so `public/models/…` becomes `/models/…` and the app can fetch the registry and packages.

   Examples:

   ```bash
   npx --yes serve dist
   # or, if you use Python
   cd dist && python3 -m http.server 8080
   ```

3. Open the server URL in the browser. **No** Node process is required at runtime—only static files. You can also copy `dist/` to another machine, a NAS share, or object storage as long as paths stay the same.

**Firewall:** if you listen on `0.0.0.0` or another port, open that port in `firewalld` / `ufw` as you would for any local static site.

---

## Using the web interface

### What you are looking at

- A short **note** at the top explains that the map is **offline** (it does not read a physical keyboard), and that **blue** tints mean the same **vertical** trace, **amber** tints the same **horizontal** trace, as a simplified schematic.

### Model selection

- **Keyboard model** — dropdown driven by `public/models/registry.yaml`. It loads the selected package (YAML) from `public/models/<packagePath>/`.

- If a package **fails validation with errors** (e.g. broken references), a **red** message appears under the dropdown.

### Main diagram (center)

- **Tail strip (“Vertical Traces” / “Horizontal Traces”)** — number **1…16** and letters **A…H** for the 1391401 sample; other models can define a different set of `ribbon_contacts` and `traces`. The highlighted box matches the traces currently used for the drawing.  
- **Keyboard** — each key is clickable.
- **Click a key** to mark it as **“dead”** (not registering). Click again to **clear**. Multiple keys can be selected.
- **Tints** — keys that share the same vertical and/or horizontal trace as your selection (when those traces are visible) are tinted to show **electrical grouping** on the schematic.
- **Line overlays** — paths run from the tail to keys. With **one** key selected, the app draws a straight run from the tail to that key for the vertical and horizontal path that meet at the key. With more keys (or from the panel) it can show longer paths in **reading order**.

### Selection legend (under the page title, when it applies)

- If **one** key is selected, a line like “**Bksp** uses: **Vertical: …** + **Horizontal: …**” with color swatches shows the two **trace names** for that key.

- If **several** keys are selected, a shorter multi-key hint is shown.

### “Hide side panel” (top right)

- Toggles the **Traces and checks** panel to give the diagram more width on small screens. Toggle again to show it.

### Side panel — “Traces and checks” (when visible)

- **Selected keys (not registering)**  
  - Lists the keys you marked, with a short line naming their **vertical + horizontal** traces.  
  - **Clear selected keys** removes all dead marks.

- **Trace visibility**  
  - **Show selection traces only** — limits overlays to traces used by the currently “dead” keys (needs at least one such key).  
  - **Show all model traces** — turns on every path in the loaded model.  
  - **Hide all trace overlays** — clears the overlay set.  
  - The **list of checkboxes** is the full list of traces currently shown (depends on the buttons above and what you have selected). Each row has a **colored pill** and the trace **display name** from the package.

- **Row / trace interaction in the list**  
  - **Check / uncheck** a trace — show or hide that overlay.  
  - **Click a trace row (outside the checkbox)** — **focus** that trace: **isolation** mode dims other paths and tints, and the corresponding tail contact is emphasized. **Clear isolation** in the line that appears, or by focusing another trace, ends isolation.

- **Pointer hover** on a trace row highlights keys on that trace in the diagram (glow) while the pointer is over the row.

- **Keys on each active trace** — for each visible trace, lists **up to 32** other keys on that path (key label and internal `keyId`).

- **Comparison keys to try** — when data allows, suggests a few other keys to test on the same traces to narrow down **wide** vs **local** failures. Not a diagnosis; it is a test idea.

- **Troubleshooting summary** — auto-generated text based on your selection and shared traces.

- **Advanced details ( ribbon, roles )** (collapsed) — small technical note about which tail contacts are highlighted, and a list of those contacts. Useful for package authors; optional for end users.

---

## How the data is structured

Each “keyboard model” is a **folder of YAML** files, listed in the manifest. The app expects a consistent **contract** (file names on disk, fields in `manifest.files`). The TypeScript types live in `src/domain/types.ts` (`KeyboardModelManifest`, `KeyboardKey`, `KeyboardTrace`, `TracePath`, `RibbonContact`, `KeyTraceMapEntry`).

| File (typical)         | Role |
| ---------------------- | ---- |
| `manifest.yaml`        | Identity, version, and pointers to the other files. |
| `keys.yaml`            | All key caps: positions in SVG space and labels. |
| `traces.yaml`          | Every “wire” in the model (vertical, horizontal, etc.) with `displayName` and a `ribbonContactId`. |
| `trace_paths.yaml`     | One SVG path `d` per trace (used for validation/authoring; the on-screen line drawing is also computed in the app for clarity). |
| `ribbon_contacts.yaml` | Tail / FFC “pin” positions so highlights and line starts line up. |
| `key_trace_map.yaml`   | **Two** rows per key: `pathA` and `pathB`, each to one `traceId` (in the 1391401 build, pathA = vertical, pathB = horizontal). |

---

## Add a new Model M (or Unicomp-style) model

The UI is **generic**: it does not hardcode “102 keys” or “16+8” traces. Your new package must satisfy **validation** in `src/domain/validation.ts`. In practice you will add a new directory and register it in `registry.yaml`.

### 1. Choose `modelId` and folder name

- Example: `ibm-m122-terminal`, `unicomp-122-classic-2020`.  
- Use a **short, unique** `modelId` and put files under e.g. `public/models/ibm-m122-terminal/`.

### 2. Gather electrical truth

You need, for every key, **which** vertical-trace and which horizontal-trace it belongs to, from:

- A published **scan matrix** or service manual for that board, **or**  
- Your own **continuity / beep** mapping, **or**  
- Community sources (verify against hardware).

**IBM 122 (M122)** — terminal-style **122 keys**, different block layout and often a **larger** matrix than 16×8. The exact count of FFC lines and the mapping to keys is **not** the same as the 1391401 102-key package: you must author traces and the map to match *that* board, not copy 1391401 counts blindly.

**Unicomp** — many boards are “Model M class” and share membrand ideas, but **PCB, tail count, and matrix** can differ by part (New Model M, Classic, 122, etc.). Treat each **product line / PCB** you care about as its own model package with its own **verified** matrix.

### 3. Build `keys.yaml`

- Define a consistent **SVG coordinate** system (e.g. 920px wide as in the sample) and a `keyId` + `displayName` for every key.  
- The sample layout is produced by `tools/generate-1391401-package.mjs` from a `LAYOUT_RAW` table. For a new model you can copy that file as a **second generator** (e.g. `tools/generate-m122-package.mjs`) with your own `LAYOUT_RAW` for 122 key positions, or you can hand-edit YAML.  
- Avoid overlapping `x,y,width,height` (see existing diagram tuning in the 1391401 generator for lessons).

### 4. Build `traces.yaml` and `ribbon_contacts.yaml`

- For each **trace** in your matrix, add a `trace` record with a stable `traceId` (e.g. `v_01` … or keep `solid_01` style) and a `displayName` (e.g. “Vertical trace 3”).  
- `layerId` is **informational** for tints: `membrane_solid` uses the **cool/blue** family, `membrane_dashed` the **warm/amber** family in `src/lib/traceColor.ts`. The **first** per-key role in `key_trace_map` should be the one you want shown as the first path in the UI (sample uses pathA = vertical).  
- `ribbon_contacts` must have **one contact per trace** in the **same 2D system** as `keys`, so the SVG header strip and lines **line up** (the sample generator places pins in a 920px-wide band).

### 5. Build `key_trace_map.yaml`

- For **every** `keyId`, **exactly two** entries: one `pathA`, one `pathB`, and **two different** `traceId` values.  
- That is how the UI knows “this key sits at the crossing of this vertical and this horizontal” path for troubleshooting.

### 6. Build `trace_paths.yaml`

- Each `traceId` from `traces` needs at least one `geometry` (non-empty SVG `d` string). The 1391401 script generates pin-to-sorted-key polylines. You can mirror that logic in a new generator or paste hand-traced `d` values. **Warnings** may appear for empty paths but **errors** block load.

### 7. `manifest.yaml`

- Set `modelId`, `displayName`, `modelVersion`, `description`, and `files` to match your file names.  
- Optional: `dataNotes` for your own maintainer text (the main UI no longer shows a long blurb; keep notes here for people editing YAML).

### 8. Register in the registry

Edit `public/models/registry.yaml`:

```yaml
models:
  - modelId: ibm-1391401-ansi
    packagePath: ibm-1391401-ansi
  - modelId: your-new-model
    packagePath: your-new-model
```

- **`packagePath`** is the **folder name** under `public/models/`.

### 9. Test

```bash
npm run dev
```

Select the new model. Fix any **red** “Package load” line until the diagram opens. `npm run build` must pass for a clean deploy.

### 10. Optional: copy and adapt the 1391401 generator

- `tools/generate-1391401-package.mjs` shows end-to-end generation: layout, kbupgrade **vertical** lines, JSON **horizontal** lines, and YAML emission. For **M122** or a **Unicomp** list, start by **duplicating** that script and **replacing** the matrix and layout sources with your own, rather than overloading a single 102-key script. Commit under a new filename so 1391401 and other models stay maintainable.

---

## The bundled 102-key ANSI (1391401) sample

- **Vertical traces** (16) — from kbupgrade [1391401.matrix](https://raw.githubusercontent.com/rhomann/kbupgrade/master/matrices/1391401.matrix).  
- **Horizontal traces** (A…H) — from `C0`…`C7` in `modelm-102-key-1391401/ansi-matrix.json` (see that folder’s README for caveats on duplicate (R,C) cells). The generator takes **row** from kbupgrade and **column** from the JSON.  
- Regenerate after layout/matrix changes:

  ```bash
  npm run generate:model
  ```

---

## Validation

`loadModelPackage` runs `validateModel()` in `src/domain/validation.ts`. **Error**-level issues become the **Package load** string and block a clean handoff to the diagram. **Warning**-level items (e.g. missing path geometry) can still allow the app to run.

---

## Project layout

- `public/models/` — static registry and model packages.  
- `src/domain/` — types, `validateModel`, selectors, troubleshooting.  
- `src/lib/` — trace color helpers, path display geometry.  
- `src/components/` — `KeyboardDiagram`, `SvgRibbonGutter`, `InspectorPanel`.  
- `src/ui/App.tsx` — shell, loading, selection state.  
- `tools/generate-1391401-package.mjs` — sample 102-key pack generator.

---

## Assumptions and limitations

- Guidance text is a **checklist**, not a guarantee.  
- Stroke colors are HSL-based per `traceId`, not brand-accurate ink.  
- The 1391401 data includes a rarely used **“Intl”**-style key position in the layout for kbupgrade alignment; your board may not have that cap.  
- No automated test suite in v1; `npm run build` type-checks the app.

---

## License

Application code in this repository is part of the troubleshooting tool project. Third-party matrix references (e.g. kbupgrade) are described in `dataNotes` and documentation, not as product branding in the app UI.
