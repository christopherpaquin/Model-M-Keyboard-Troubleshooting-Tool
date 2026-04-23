import { useMemo } from "react";
import type { KeyboardKey, KeyTraceMapEntry, KeyboardTrace, RibbonContact } from "../domain/types";
import { tracesForKey } from "../domain/selectors";
import { strokeForTrace } from "../lib/traceColor";
import { buildTracePathGeometry, keyRectFillTints } from "../lib/computeTraceDisplayGeometry";
import { SvgRibbonGutter } from "./SvgRibbonGutter";

export type SelectionTraceInfo = {
  keyLabel: string;
  pathA: { id: string; name: string };
  pathB: { id: string; name: string };
};

export function KeyboardDiagram(props: {
  keys: KeyboardKey[];
  deadKeyIds: Set<string>;
  focusKeyId: string | null;
  /** When true, only keys on the focused trace are tinted. */
  isolate: boolean;
  focusTraceId: string | null;
  visibleTraceIds: Set<string>;
  hoverTraceId: string | null;
  keyTraceMap: KeyTraceMapEntry[];
  traces: KeyboardTrace[];
  ribbonById: Map<string, RibbonContact>;
  ribbonHighlights: Set<string>;
  ribbonSolid: RibbonContact[];
  ribbonDashed: RibbonContact[];
  onToggleKey: (keyId: string) => void;
  selectionTraces: SelectionTraceInfo | null;
}): React.ReactElement {
  const sortedKeys = [...props.keys].sort((a, b) => b.width * b.height - a.width * a.height);

  const keyById = useMemo(
    () => new Map(props.keys.map((k) => [k.keyId, k])),
    [props.keys],
  );
  const traceById = useMemo(() => new Map(props.traces.map((t) => [t.traceId, t])), [props.traces]);
  const traceByContact = useMemo(
    () => new Map(props.traces.map((t) => [t.ribbonContactId, t])),
    [props.traces],
  );

  const pathDByTrace = useMemo(() => {
    const out = new Map<string, string>();
    for (const traceId of props.visibleTraceIds) {
      out.set(
        traceId,
        buildTracePathGeometry(
          traceId,
          keyById,
          props.keyTraceMap,
          props.traces,
          props.ribbonById,
          props.focusKeyId,
        ),
      );
    }
    return out;
  }, [props.focusKeyId, props.keyTraceMap, props.ribbonById, props.traces, props.visibleTraceIds, keyById]);

  return (
    <div className="kbd-wrap">
      {props.selectionTraces ? (
        <div className="kbd-trace-legend" aria-live="polite">
          <span className="kbd-trace-legend__label">“{props.selectionTraces.keyLabel}”</span> uses:{" "}
          <span className="kbd-trace-legend__row">
            <span
              className="swatch"
              style={{ background: strokeForTrace(props.selectionTraces.pathA.id) }}
              title="Vertical-trace layer (continuous paths)"
            />
            <span className="kbd-trace-legend__name">Vertical: {props.selectionTraces.pathA.name}</span>
          </span>
          <span className="kbd-trace-legend__sep" aria-hidden>
            +
          </span>
          <span className="kbd-trace-legend__col">
            <span
              className="swatch"
              style={{ background: strokeForTrace(props.selectionTraces.pathB.id) }}
              title="Horizontal-trace layer (dotted side of membrane)"
            />
            <span className="kbd-trace-legend__name">Horizontal: {props.selectionTraces.pathB.name}</span>
          </span>
        </div>
      ) : props.deadKeyIds.size > 1 ? (
        <p className="kbd-trace-legend kbd-trace-legend--muted" role="note">
          {props.deadKeyIds.size} keys — blue = vertical, amber = horizontal, per key.
        </p>
      ) : null}

      <svg
        className="kbd-canvas"
        viewBox="0 0 920 520"
        role="img"
        aria-label="Keyboard with membrane tail pins; trace lines start from the numbered boxes and letters"
        width="920"
        height="520"
        preserveAspectRatio="xMidYMin meet"
      >
        <rect x="0" y="0" width="920" height="520" fill="#0a0b0f" stroke="#232733" />
        <SvgRibbonGutter
          ribbonSolid={props.ribbonSolid}
          ribbonDashed={props.ribbonDashed}
          ribbonHighlights={props.ribbonHighlights}
          traceByContactId={traceByContact}
        />
        <line x1="0" y1="100" x2="920" y2="100" stroke="#2e3444" strokeWidth="1" />
        {[...props.visibleTraceIds]
            .map((id) => ({ id, d: pathDByTrace.get(id) ?? "" }))
            .filter((x) => x.d.length > 0)
            .map((p) => {
              const isFocus = props.focusTraceId === p.id;
              const isIso = props.isolate && props.focusTraceId;
              const opacity = isIso ? (isFocus ? 0.92 : 0.12) : 0.55;
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill="none"
                  stroke={strokeForTrace(p.id)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={isFocus && props.isolate ? 3.2 : 1.8}
                  opacity={opacity}
                  style={{ vectorEffect: "non-scaling-stroke" as const }}
                />
              );
            })}

          {sortedKeys.map((k) => {
            const selected = props.deadKeyIds.has(k.keyId);
            const tids = tracesForKey(props.keyTraceMap, k.keyId);
            const glow = props.hoverTraceId && tids.includes(props.hoverTraceId) ? "rgba(107,158,245,0.65)" : null;
            const fs = k.displayName.length > 3 || k.keyId === "backspace" ? 8.5 : 10.5;
            const tints = keyRectFillTints(
              k,
              props.keyTraceMap,
              props.visibleTraceIds,
              traceById,
              props.isolate,
              props.focusTraceId,
              selected,
            );
            return (
              <g key={k.keyId}>
                <rect
                  x={k.x}
                  y={k.y}
                  width={k.width}
                  height={k.height}
                  rx="3"
                  fill={tints.fill}
                  stroke={glow ?? (selected ? "rgba(240,113,120,0.7)" : tints.borderExtra ?? "#2e3444")}
                  strokeWidth={glow ? 2.2 : tints.borderExtra ? 1.3 : 1}
                  onClick={() => props.onToggleKey(k.keyId)}
                  style={{ cursor: "pointer" }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      props.onToggleKey(k.keyId);
                    }
                  }}
                  aria-pressed={selected}
                />
                <text
                  x={k.x + k.width / 2}
                  y={k.y + k.height / 2 + 3}
                  textAnchor="middle"
                  fontSize={fs}
                  fill="#c9ced9"
                  pointerEvents="none"
                  style={{ userSelect: "none" as const }}
                >
                  {k.displayName}
                </text>
              </g>
            );
          })}
      </svg>
      <div className="kbd-legend subtle">
        Lines go from the tail to keys (with one key selected, the vertical and horizontal meet there). Click a key to mark
        it dead; click again to clear.
      </div>
    </div>
  );
}
