import type { KeyboardKey, KeyboardTrace, RibbonContact } from "../domain/types";
import { strokeForTrace } from "../lib/traceColor";
import type { ComparisonKeySuggestion } from "../domain/types";
import { keysSharingTrace } from "../domain/selectors";
import type { KeyTraceMapEntry } from "../domain/types";
import { traceNarrationForKey } from "../domain/troubleshooting";
import { getTraceById } from "../domain/selectors";

export function InspectorPanel({
  keyById,
  map,
  deadKeyIds,
  deadKeys,
  traces,
  modelTraces,
  onToggleTrace,
  onFocusTrace,
  onHoverTrace,
  onClearIsolate,
  onClearKeys,
  focusTraceId,
  isolate,
  onShowAll,
  onHideAll,
  onToSelection,
  drawSet,
  ribbon,
  comp,
  summary,
}: {
  keyById: Map<string, KeyboardKey>;
  map: KeyTraceMapEntry[];
  deadKeyIds: string[];
  deadKeys: KeyboardKey[];
  traces: KeyboardTrace[];
  modelTraces: KeyboardTrace[];
  onToggleTrace: (id: string, on: boolean) => void;
  onFocusTrace: (id: string) => void;
  onHoverTrace: (id: string | null) => void;
  onClearIsolate: () => void;
  onClearKeys: () => void;
  focusTraceId: string | null;
  isolate: boolean;
  onShowAll: () => void;
  onHideAll: () => void;
  onToSelection: () => void;
  drawSet: Set<string>;
  ribbon: RibbonContact[];
  comp: ComparisonKeySuggestion[];
  summary: string[];
}): React.ReactElement {
  const tmap = getTraceById(modelTraces);
  return (
    <aside className="aside" aria-label="Troubleshooting">
      <h1>Traces and checks</h1>
      <p className="subtle">This panel describes electrical paths in the selected model. Data may be partial — treat guidance as a checklist, not a certain diagnosis.</p>
      {deadKeys.length > 0 ? (
        <section>
          <h2>Selected keys (not registering)</h2>
          <div className="btn-row" style={{ marginTop: 6 }}>
            <button type="button" onClick={onClearKeys}>
              Clear selected keys
            </button>
          </div>
          <ul className="list-plain">
            {deadKeys.map((k) => {
              const s = traceNarrationForKey(map, tmap, k.keyId);
              return (
                <li key={k.keyId} style={{ margin: "0.2em 0" }}>
                  <code className="key-tag">{k.displayName}</code>{" "}
                  <span className="muted">
                    — {s.membrane1Top} + {s.membrane2Bottom}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <p className="subtle" style={{ marginTop: 8 }}>
          No keys selected on the layout yet. Click keys that fail in normal use.
        </p>
      )}

      <section className="m-top">
        <h2>Trace visibility</h2>
        <div className="btn-row">
          <button className="primary" type="button" onClick={onToSelection} disabled={deadKeyIds.length === 0}>
            Show selection traces only
          </button>
          <button type="button" onClick={onShowAll}>
            Show all model traces
          </button>
          <button type="button" onClick={onHideAll}>
            Hide all trace overlays
          </button>
        </div>
        {focusTraceId && isolate ? (
          <p className="m-top" style={{ fontSize: 0.85, color: "var(--muted)" }}>
            Isolating: <code>{tmap.get(focusTraceId)?.displayName ?? focusTraceId}</code>{" "}
            <button type="button" onClick={onClearIsolate}>
              Clear isolation
            </button>
          </p>
        ) : null}
        {traces.length > 0 ? (
          <div className="m-top">
            {traces.map((t) => {
              const on = drawSet.has(t.traceId);
              return (
                <div
                  key={t.traceId}
                  className="trace-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => onFocusTrace(t.traceId)}
                  onPointerEnter={() => onHoverTrace(t.traceId)}
                  onPointerLeave={() => onHoverTrace(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onFocusTrace(t.traceId);
                  }}
                >
                  <label
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: "flex", flex: 1, alignItems: "center" }}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => onToggleTrace(t.traceId, e.target.checked)}
                    />
                    <span className="pill" style={{ background: strokeForTrace(t.traceId) }} />
                    {t.displayName}
                  </label>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="m-top">
        <h2>Keys on each active trace</h2>
        {traces.length === 0 ? (
          <p className="subtle" style={{ margin: 0 }}>
            Select a dead key to list shared traces, or use “show all model traces” to load every path.
          </p>
        ) : (
          traces.map((t) => (
            <div key={t.traceId} className="m-top" style={{ marginTop: 8 }}>
              <div>
                <span className="pill" style={{ background: strokeForTrace(t.traceId) }} />
                <code>{t.displayName}</code>
              </div>
              <p className="subtle" style={{ margin: "0.2em 0" }}>
                {t.description}
              </p>
              <ul className="list-plain">
                {keysSharingTrace(map, keyById, t.traceId)
                  .slice(0, 32)
                  .map((k) => (
                    <li key={k.keyId} style={{ fontSize: 0.85 }}>
                      {k.displayName} <span className="muted">({k.keyId})</span>
                    </li>
                  ))}
                {keysSharingTrace(map, keyById, t.traceId).length > 32 ? (
                  <li className="muted" style={{ fontSize: 0.85 }}>…</li>
                ) : null}
              </ul>
            </div>
          ))
        )}
      </section>

      {comp.length > 0 ? (
        <section className="m-top">
          <h2>Comparison keys to try</h2>
          <p className="subtle" style={{ margin: "0.1em 0" }}>
            Plain keys on the same trace can help separate a wide trace break from a single site failure. Results are not definitive.
          </p>
          <ul className="list-plain">
            {comp.map((c) => (
              <li key={`${c.keyId}-${c.traceId}`} style={{ fontSize: 0.9, margin: "0.2em 0" }}>
                <code className="key-tag">{c.displayName}</code> on{" "}
                <code>{tmap.get(c.traceId)?.displayName ?? c.traceId}</code>
                <br />
                <span className="muted">{c.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="m-top">
        <h2>Troubleshooting summary</h2>
        {summary.map((line) => (
          <p key={line.slice(0, 32)} className="subtle" style={{ margin: "0.3em 0" }}>
            {line}
          </p>
        ))}
        <p className="subtle" style={{ margin: "0.3em 0" }}>
          Practical next checks often include: reseating the membrane tail(s) into the board connector, inspecting
          the tail and contacts for damage or films, and spot-checking a few more keys on the same traces. Consider
          mechanical causes (bent buckling element, misalignment, or stabilizer issues) for single-key failures. Avoid
          claiming certainty from visuals alone; use the testing methods you trust (continuity where appropriate, swap
          tests, controlled reassembly).
        </p>
        <p className="m-top" style={{ marginTop: 8, fontSize: 0.85, color: "var(--bad)" }}>
          A dead key is not always a trace break.
        </p>
      </section>

      <section className="m-top">
        <details>
          <summary>Advanced details (ribbon, roles)</summary>
          <p className="dev">
            <strong>Tail contact highlights</strong> match Membrane 1 (top) and Membrane 2 (bottom) traces in this model package. Verify
            on your own board and connector.
          </p>
          {ribbon.length > 0 ? (
            <ul className="list-plain dev">
              {ribbon.map((r) => (
                <li key={r.contactId}>
                  {r.label} — {r.layerId} ({r.contactNumber})
                </li>
              ))}
            </ul>
          ) : null}
        </details>
      </section>
    </aside>
  );
}
