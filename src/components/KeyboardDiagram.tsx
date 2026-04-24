import { useMemo } from "react";
import type { KeyboardKey, KeyTraceMapEntry, KeyboardTrace, RibbonContact } from "../domain/types";
import { tracesForKey } from "../domain/selectors";
import { strokeForTrace } from "../lib/traceColor";
import { buildTracePathGeometry, keyRectFillTints } from "../lib/computeTraceDisplayGeometry";
import { keyCapLabel, keyCapLabelLines } from "../lib/keyCapLabel";
import { SvgRibbonGutter } from "./SvgRibbonGutter";

export type SelectionTraceInfo = {
  keyLabel: string;
  /** Membrane 1 (top) — pathB / column scan */
  membrane1Top: { id: string; name: string };
  /** Membrane 2 (bottom) — pathA / row scan */
  membrane2Bottom: { id: string; name: string };
  /** Tail pad labels for this key’s two ribbon contacts */
  ribbonM1Contact: string;
  ribbonM2Contact: string;
};

export function KeyboardDiagram(props: {
  /** Keys to draw. May be a subset of `allKeysForTraceGeometry` to hide non-physical QMK nodes. */
  keys: KeyboardKey[];
  /** If set, trace polylines use this full set (positions) so lines stay correct. Defaults to `keys`. */
  allKeysForTraceGeometry?: KeyboardKey[];
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
  /** When 2+ keys: explains common-trace (intersection) behavior */
  multiSelectionTraceHint: string | null;
}): React.ReactElement {
  const sortedKeys = [...props.keys].sort((a, b) => b.width * b.height - a.width * a.height);
  const keysForGeometry = props.allKeysForTraceGeometry ?? props.keys;

  const keyById = useMemo(
    () => new Map(keysForGeometry.map((k) => [k.keyId, k])),
    [keysForGeometry],
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

  const canvasSize = useMemo(() => {
    const padX = 24;
    const padY = 20;
    let w = 920;
    let h = 520;
    for (const k of keysForGeometry) {
      w = Math.max(w, k.x + k.width + padX);
      h = Math.max(h, k.y + k.height + padY);
    }
    return { w, h };
  }, [keysForGeometry]);

  return (
    <div className="kbd-wrap">
      {props.selectionTraces ? (
        <div>
          <div className="kbd-trace-legend" aria-live="polite">
            <span className="kbd-trace-legend__label">“{props.selectionTraces.keyLabel}”</span> uses:{" "}
            <span className="kbd-trace-legend__row">
              <span
                className="swatch"
                style={{ background: strokeForTrace(props.selectionTraces.membrane1Top.id) }}
                title="Membrane 1 (top) / column trace"
              />
              <span className="kbd-trace-legend__name">{props.selectionTraces.membrane1Top.name}</span>
            </span>
            <span className="kbd-trace-legend__sep" aria-hidden>
              +
            </span>
            <span className="kbd-trace-legend__col">
              <span
                className="swatch"
                style={{ background: strokeForTrace(props.selectionTraces.membrane2Bottom.id) }}
                title="Membrane 2 (bottom) / row trace"
              />
              <span className="kbd-trace-legend__name">{props.selectionTraces.membrane2Bottom.name}</span>
            </span>
          </div>
          <p className="subtle" style={{ margin: "0.3em 0 0 0.1em", fontSize: 12 }} role="note">
            Ribbon: Membrane 1 = tail contact <code>{props.selectionTraces.ribbonM1Contact}</code> · Membrane 2 ={" "}
            <code>{props.selectionTraces.ribbonM2Contact}</code> (see highlighted pads above).
          </p>
        </div>
      ) : props.deadKeyIds.size > 1 && props.multiSelectionTraceHint ? (
        <p className="kbd-trace-legend kbd-trace-legend--muted" role="note">
          {props.multiSelectionTraceHint}
        </p>
      ) : null}

      <svg
        className="kbd-canvas"
        viewBox={`0 0 ${canvasSize.w} ${canvasSize.h}`}
        role="img"
        aria-label="Keyboard with ribbon tail: Membrane 1 column traces and Membrane 2 row traces; trace lines from each pin to keys"
        width={String(canvasSize.w)}
        height={String(canvasSize.h)}
        preserveAspectRatio="xMidYMin meet"
      >
        <rect x="0" y="0" width={canvasSize.w} height={canvasSize.h} fill="#0a0b0f" stroke="#232733" />
        <SvgRibbonGutter
          stripWidth={canvasSize.w}
          ribbonSolid={props.ribbonSolid}
          ribbonDashed={props.ribbonDashed}
          ribbonHighlights={props.ribbonHighlights}
          traceByContactId={traceByContact}
        />
        <line x1="0" y1="100" x2={canvasSize.w} y2="100" stroke="#2e3444" strokeWidth="1" />
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
            const capLines = keyCapLabelLines(k.keyId, k.displayName);
            const labelFlat = keyCapLabel(k.keyId, k.displayName);
            const fs =
              capLines.length > 1
                ? Math.min(9, 7 + k.width / 20)
                : labelFlat.length > 14
                  ? 6
                  : labelFlat.length > 7 || k.keyId.length > 14
                    ? 7.5
                    : labelFlat.length > 3
                      ? 8.5
                      : 10.5;
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
                  y={
                    capLines.length > 1
                      ? k.y + k.height / 2 - 4
                      : k.y + k.height / 2 + 3
                  }
                  textAnchor="middle"
                  fontSize={fs}
                  fill="#c9ced9"
                  pointerEvents="none"
                  style={{ userSelect: "none" as const }}
                >
                  {capLines.map((line, li) => (
                    <tspan
                      x={k.x + k.width / 2}
                      key={li}
                      dy={li === 0 ? 0 : Math.min(11, fs + 1)}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
      </svg>
      <div className="kbd-legend subtle">
        Lines go from the tail to keys; at each key, Membrane 1 (top) and Membrane 2 (bottom) traces meet. Click a key to mark
        it dead; click again to clear.
      </div>
    </div>
  );
}
