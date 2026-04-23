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
}): React.ReactElement {
  return (
    <g aria-label="Membrane tail: vertical 1 to 16 and horizontal A to H" role="group">
      <rect x="0" y="0" width="920" height="100" fill="#0e1016" stroke="#2a3040" strokeWidth="1" />
      <text x="8" y="16" fontSize="12" fill="#9aa3b2" style={{ userSelect: "none" }}>
        Vertical Traces
      </text>
      <text x="468" y="16" fontSize="12" fill="#9aa3b2" style={{ userSelect: "none" }}>
        Horizontal Traces
      </text>
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
    </g>
  );
}
