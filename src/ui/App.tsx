import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardDiagram } from "../components/KeyboardDiagram";
import { InspectorPanel } from "../components/InspectorPanel";
import { makeRibbonList } from "../domain/ribbonList";
import { buildTroubleshooting } from "../domain/troubleshooting";
import type { LoadedKeyboardModel, ModelsRegistry, RibbonContact } from "../domain/types";
import {
  defaultTraceSetForSelection,
  getKeyById,
  getRibbonById,
  getTraceById,
  suggestComparisonKeys,
} from "../domain/selectors";
import { loadModelPackage, loadRegistry } from "../domain/modelLoader";

export function App(): React.ReactElement {
  const [registry, setRegistry] = useState<ModelsRegistry | null>(null);
  const [model, setModel] = useState<LoadedKeyboardModel | null>(null);
  const [modelId, setModelId] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dead, setDead] = useState<Set<string>>(new Set());
  const [draw, setDraw] = useState<Set<string>>(new Set());
  const [listAll, setListAll] = useState(false);
  const [focusTrace, setFocusTrace] = useState<string | null>(null);
  const [isolate, setIsolate] = useState(false);
  const [hoverTrace, setHoverTrace] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await loadRegistry();
      setRegistry(r);
      const first = r.models[0];
      if (first) {
        setModelId(first.modelId);
        const { model: m, error } = await loadModelPackage(first.packagePath);
        setModel(m);
        setLoadError(error ?? null);
      }
    })().catch((e) => {
      setLoadError(e instanceof Error ? e.message : String(e));
    });
  }, []);

  const reload = useCallback(async (mid: string) => {
    const entry = registry?.models.find((m) => m.modelId === mid);
    if (!entry) return;
    setModelId(mid);
    const { model: m, error } = await loadModelPackage(entry.packagePath);
    setModel(m);
    setLoadError(error ?? null);
    setDead(new Set());
    setDraw(new Set());
    setListAll(false);
    setFocusTrace(null);
    setIsolate(false);
    setHoverTrace(null);
  }, [registry]);

  const relTraceIds = useMemo(() => {
    if (!model) return new Set<string>();
    return new Set(defaultTraceSetForSelection(model.keyTraceMap, Array.from(dead)));
  }, [model, dead]);

  const traceList = useMemo(() => {
    if (!model) return [];
    return listAll ? model.traces : model.traces.filter((t) => relTraceIds.has(t.traceId));
  }, [model, listAll, relTraceIds]);

  const deadArr = useMemo(() => [...dead], [dead]);
  const deadSig = useMemo(() => [...dead].sort().join("|"), [dead]);

  const keyById = useMemo(() => (model ? getKeyById(model.keys) : new Map<string, import("../domain/types").KeyboardKey>()), [model]);
  const ribbonById = useMemo(
    () => (model ? getRibbonById(model.ribbonContacts) : new Map<string, RibbonContact>()),
    [model],
  );

  const syncDrawToRelevant = useCallback(() => {
    setDraw(new Set(relTraceIds));
    setListAll(false);
  }, [relTraceIds]);

  useEffect(() => {
    syncDrawToRelevant();
  }, [syncDrawToRelevant, deadSig, model?.manifest.modelId]);

  const { summaryLines } = useMemo(() => {
    if (!model) return { summaryLines: [] as string[] };
    return buildTroubleshooting(model.keyTraceMap, deadArr, model.traces);
  }, [model, deadArr]);

  const selectionTraces = useMemo(() => {
    if (!model || deadArr.length !== 1) return null;
    const keyId = deadArr[0]!;
    const tmap = getTraceById(model.traces);
    const rows = model.keyTraceMap.filter((e) => e.keyId === keyId);
    const pathA = rows.find((e) => e.role === "pathA");
    const pathB = rows.find((e) => e.role === "pathB");
    if (!pathA || !pathB) return null;
    const tr1 = tmap.get(pathB.traceId);
    const tr2 = tmap.get(pathA.traceId);
    const c1 = tr1 != null ? (ribbonById.get(tr1.ribbonContactId)?.contactNumber) : undefined;
    const c2 = tr2 != null ? (ribbonById.get(tr2.ribbonContactId)?.contactNumber) : undefined;
    return {
      keyLabel: keyById.get(keyId)?.displayName ?? keyId,
      membrane1Top: { id: pathB.traceId, name: tr1?.displayName ?? pathB.traceId },
      membrane2Bottom: { id: pathA.traceId, name: tr2?.displayName ?? pathA.traceId },
      ribbonM1Contact: c1 ?? "—",
      ribbonM2Contact: c2 ?? "—",
    };
  }, [model, deadArr, keyById, ribbonById]);

  const comp = useMemo(() => {
    if (!model) return [];
    return suggestComparisonKeys(model.keyTraceMap, keyById, deadArr, [...relTraceIds], 3);
  }, [model, keyById, deadArr, relTraceIds]);

  const multiSelectionTraceHint = useMemo(() => {
    if (dead.size < 2) return null;
    const n = relTraceIds.size;
    if (n === 0) {
      return "No trace is common to all selected keys — nothing highlighted on the tail. The failures may be unrelated in this model, or separate contact issues; we cannot show contact quality here.";
    }
    return `Showing ${n} trace${n === 1 ? "" : "s"} common to all ${dead.size} selected keys. A break on a shared line can cause multiple dead keys.`;
  }, [dead, relTraceIds]);

  const [ribbonHighlights, ribbonSolid, ribbonDashed, ribbonList] = useMemo(() => {
    if (!model) {
      return [new Set<string>() as Set<string>, [] as RibbonContact[], [] as RibbonContact[], [] as RibbonContact[]] as const;
    }
    const h = new Set(
      makeRibbonList(model.traces, ribbonById, draw, isolate, focusTrace).map((c) => c.contactId),
    );
    if (hoverTrace) {
      const t = model.traces.find((x) => x.traceId === hoverTrace);
      if (t) h.add(t.ribbonContactId);
    }
    const solid = model.ribbonContacts.filter((c) => c.layerId === "membrane_solid");
    const dashed = model.ribbonContacts.filter((c) => c.layerId === "membrane_dashed");
    const rlist: RibbonContact[] = [...makeRibbonList(model.traces, ribbonById, draw, isolate, focusTrace)];
    return [h, solid, dashed, rlist] as const;
  }, [model, ribbonById, draw, isolate, focusTrace, hoverTrace]);

  if (!model) {
    return (
      <div className="app-shell" style={{ padding: 16 }}>
        <h1>Model M troubleshooting</h1>
        {loadError ? <p className="danger">Could not load: {loadError}</p> : <p>Loading model registry…</p>}
      </div>
    );
  }

  return (
    <div className={showPanel ? "app-shell" : "app-shell app-shell--no-panel"}>
      <main className="workspace">
            <header className="app-header">
              <div className="app-header__top">
                <div className="app-header__title-block">
                  <h1>IBM Model M Keyboard - Membrane Trace Mapper</h1>
                </div>
                <div className="app-header__actions">
                  <div className="btn-row" style={{ justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setShowPanel((v) => !v)}
                      title={showPanel ? "Widen the keyboard diagram" : "Show analysis and trace controls"}
                    >
                      {showPanel ? "Hide side panel" : "Show side panel"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="app-header__toolbar">
                <div className="field">
                  <label htmlFor="app-model-select">
                    Keyboard model {registry ? null : <span className="subtle">(no registry yet)</span>}
                  </label>
                  {registry && (
                    <select
                      id="app-model-select"
                      value={modelId}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) void reload(v);
                      }}
                      aria-label="Model"
                    >
                      {registry.models.map((m) => (
                        <option value={m.modelId} key={m.modelId}>
                          {m.modelId}
                        </option>
                      ))}
                    </select>
                  )}
                  {loadError ? <p className="danger" style={{ margin: "0.2em 0" }}>Package load: {loadError}</p> : null}
                </div>
              </div>
              <div
                className="app-header__blurb"
                role="note"
                aria-label="Map source and behavior"
              >
                <p className="app-header__blurb--lead">
                  Offline only — the diagram does <strong>not</strong> read your board.
                </p>
                <p className="app-header__blurb--body">
                  <strong>One key selected:</strong> both M1 and M2 traces and tail pads
                </p>
                <p className="app-header__blurb--body app-header__blurb--body-tight">
                  <strong>Several keys:</strong> only <strong>traces common to every</strong> selected key are drawn.
                </p>
                <p className="app-header__blurb--body app-header__blurb--body-tight">
                  <strong>Tints:</strong> <span className="app-header__tint app-header__tint--m2">blue</span> = Membrane
                  2 (1…16), <span className="app-header__tint app-header__tint--m1">amber</span> = Membrane 1 (A…H) on
                  unselected keys.
                </p>
              </div>
            </header>
            <KeyboardDiagram
              keys={model.keys}
              deadKeyIds={dead}
              focusKeyId={dead.size === 1 ? (deadArr[0] ?? null) : null}
              visibleTraceIds={draw}
              focusTraceId={focusTrace}
              hoverTraceId={hoverTrace}
              isolate={isolate}
              keyTraceMap={model.keyTraceMap}
              traces={model.traces}
              ribbonById={ribbonById}
              ribbonHighlights={ribbonHighlights}
              ribbonSolid={ribbonSolid}
              ribbonDashed={ribbonDashed}
              onToggleKey={(keyId) => {
                setDead((prev) => {
                  const n = new Set(prev);
                  if (n.has(keyId)) n.delete(keyId);
                  else n.add(keyId);
                  return n;
                });
              }}
              selectionTraces={selectionTraces}
              multiSelectionTraceHint={multiSelectionTraceHint}
            />
          </main>
          {showPanel ? (
            <InspectorPanel
              keyById={keyById}
              map={model.keyTraceMap}
              deadKeyIds={deadArr}
              deadKeys={deadArr.map((id) => keyById.get(id)).filter((k): k is import("../domain/types").KeyboardKey => Boolean(k))}
              traces={traceList}
              modelTraces={model.traces}
              onToggleTrace={(id, on) => {
                setDraw((prev) => {
                  const n = new Set(prev);
                  if (on) n.add(id);
                  else n.delete(id);
                  return n;
                });
              }}
              onFocusTrace={(id) => {
                setFocusTrace(id);
                setIsolate(true);
              }}
              onHoverTrace={(id) => setHoverTrace(id)}
              onClearIsolate={() => {
                setFocusTrace(null);
                setIsolate(false);
              }}
              onClearKeys={() => {
                setDead(new Set());
              }}
              focusTraceId={focusTrace}
              isolate={isolate}
              onShowAll={() => {
                setDraw(new Set(model.traces.map((t) => t.traceId)));
                setListAll(true);
              }}
              onHideAll={() => {
                setDraw(new Set());
              }}
              onToSelection={() => {
                setDraw(new Set(defaultTraceSetForSelection(model.keyTraceMap, Array.from(dead))));
                setListAll(false);
              }}
              drawSet={draw}
              ribbon={ribbonList}
              comp={comp}
              summary={summaryLines}
            />
          ) : null}
    </div>
  );
}
