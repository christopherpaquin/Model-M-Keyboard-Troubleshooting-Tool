import type { KeyboardTrace, RibbonContact } from "../domain/types";
import { strokeForTrace } from "../lib/traceColor";

/**
 * Renders the tail pin strip in the same coordinate system as the keyboard and trace paths
 * (must match `ribbon_contacts.yaml` / generator `ribbonContacts()`).
 */
export function SvgRibbonGutter(props: {
  ribbonSolid: RibbonContact[];
  ribbonDashed: RibbonContact[];
  ribbonHighlights: Set<string>;
  traceByContactId: Map<string, KeyboardTrace>;
  /** Gutter + background width (should match canvas width). */
  stripWidth?: number;
}): React.ReactElement {
  const m1Left = props.ribbonDashed[0]?.x ?? 8;
  const m2Left = props.ribbonSolid[0]?.x ?? 290;
  const d0 = props.ribbonDashed[0]?.contactNumber;
  const d1 = props.ribbonDashed[props.ribbonDashed.length - 1]?.contactNumber;
  const s0 = props.ribbonSolid[0]?.contactNumber;
  const s1 = props.ribbonSolid[props.ribbonSolid.length - 1]?.contactNumber;
  const m1label =
    props.ribbonDashed.length === 0
      ? "Membrane 1 (top)"
      : d0 != null && d1 != null && d0 !== d1
        ? `Membrane 1 (top) — ${d0}…${d1}`
        : `Membrane 1 (top) — ${props.ribbonDashed.length} column traces`;
  const m2label =
    props.ribbonSolid.length === 0
      ? "Membrane 2 (bottom)"
      : s0 != null && s1 != null && s0 !== s1
        ? `Membrane 2 (bottom) — ${s0}…${s1}`
        : `Membrane 2 (bottom) — ${props.ribbonSolid.length} row traces`;
  const w = props.stripWidth ?? 920;
  return (
    <g aria-label="Ribbon tail: column traces (Membrane 1) and row traces (Membrane 2)" role="group">
      <rect x="0" y="0" width={w} height="100" fill="#0e1016" stroke="#2a3040" strokeWidth="1" />
      <text x={m1Left} y="16" fontSize="12" fill="#9aa3b2" style={{ userSelect: "none" }}>
        {m1label}
      </text>
      <text x={m2Left} y="16" fontSize="12" fill="#9aa3b2" style={{ userSelect: "none" }}>
        {m2label}
      </text>
      {props.ribbonDashed.map((c) => {
        const hot = props.ribbonHighlights.has(c.contactId);
        const tr = props.traceByContactId.get(c.contactId);
        const stroke = tr ? strokeForTrace(tr.traceId, 0.95) : "#e0a060";
        return (
          <g key={c.contactId}>
            <rect
              x={c.x}
              y={c.y}
              width={c.width}
              height={c.height}
              rx="3"
              fill={hot ? "rgba(240, 190, 100, 0.18)" : "rgba(255,255,255,0.05)"}
              stroke={hot ? stroke : "#3a4558"}
              strokeWidth={hot ? 2.2 : 1}
            />
            <text
              x={c.x + c.width / 2}
              y={c.y + c.height * 0.7}
              fontSize="12"
              textAnchor="middle"
              fill={hot ? "#fff0dd" : "#9aa4b2"}
            >
              {c.contactNumber}
            </text>
          </g>
        );
      })}
      {props.ribbonSolid.map((c) => {
        const hot = props.ribbonHighlights.has(c.contactId);
        const tr = props.traceByContactId.get(c.contactId);
        const stroke = tr ? strokeForTrace(tr.traceId, 0.95) : "#6b9ef5";
        return (
          <g key={c.contactId}>
            <rect
              x={c.x}
              y={c.y}
              width={c.width}
              height={c.height}
              rx="3"
              fill={hot ? "rgba(107,158,245,0.22)" : "rgba(255,255,255,0.05)"}
              stroke={hot ? stroke : "#3a4558"}
              strokeWidth={hot ? 2.2 : 1}
            />
            <text
              x={c.x + c.width / 2}
              y={c.y + c.height * 0.7}
              fontSize="12"
              textAnchor="middle"
              fill={hot ? "#e8f0ff" : "#9aa4b2"}
            >
              {c.contactNumber}
            </text>
          </g>
        );
      })}
    </g>
  );
}
