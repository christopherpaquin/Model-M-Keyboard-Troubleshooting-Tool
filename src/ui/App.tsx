import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardDiagram } from "../components/KeyboardDiagram";
import { InspectorPanel } from "../components/InspectorPanel";
import { makeRibbonList } from "../domain/ribbonList";
import { buildTroubleshooting } from "../domain/troubleshooting";
import type { LoadedKeyboardModel, ModelsRegistry, RibbonContact } from "../domain/types";
import { getKeyById, getRibbonById, getTraceById, suggestComparisonKeys, tracesForKeys } from "../domain/selectors";
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
    return new Set(tracesForKeys(model.keyTraceMap, dead));
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
    return {
      keyLabel: keyById.get(keyId)?.displayName ?? keyId,
      pathA: { id: pathA.traceId, name: tmap.get(pathA.traceId)?.displayName ?? pathA.traceId },
      pathB: { id: pathB.traceId, name: tmap.get(pathB.traceId)?.displayName ?? pathB.traceId },
    };
  }, [model, deadArr, keyById]);

  const comp = useMemo(() => {
    if (!model) return [];
    return suggestComparisonKeys(
      model.keyTraceMap,
      keyById,
      deadArr,
      [...(draw.size ? draw : relTraceIds)],
      3,
    );
  }, [model, keyById, deadArr, draw, relTraceIds]);

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
            <div className="tools-row" style={{ justifyContent: "space-between" }}>
              <div>
                <h1>IBM Model M – dead key map</h1>
                <div className="subtle" style={{ marginTop: 2, maxWidth: 720 }}>
                  {model.manifest.displayName} · {model.manifest.modelVersion} · {model.manifest.layoutName}
                </div>
              </div>
              <div className="subtle" style={{ fontSize: 0.85, textAlign: "right" as const }}>
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
            <div className="panel" style={{ marginTop: 8 }}>
              <div className="field">
                <label>Keyboard model {registry ? null : <span className="subtle">(no registry yet)</span>}</label>
                {registry && (
                  <select
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
            <p className="manifest-notes manifest-notes__lead" role="note" aria-label="Map source">
              Offline only — the diagram does <strong>not</strong> read your board. Tints: <strong>blue</strong> = same
              vertical trace (1…16), <strong>amber</strong> = same horizontal trace (A…H). Simplified map, not a real membrane
              drawing.
            </p>
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
                setDraw(new Set(tracesForKeys(model.keyTraceMap, dead)));
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
