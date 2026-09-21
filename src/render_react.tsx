// BlockView — a Block → React nodes. The React peer of render_html's
// renderBlockInner, same class names so it shares the CONVERSATION_CSS.

import { Fragment } from "react";
import type { ReactNode } from "react";

import { mdInline } from "./dom.js";
import type { Block, ViewBlock } from "./wire.js";

/**
 * Draws a `view` block's ViewDescriptor. Supplied by the HOST, because drawing
 * one needs a full panel renderer (`@savvifi/meridian-web-react` + a ComponentKit)
 * and this package stays dependency-free — a chat transcript should not drag a
 * component library into a host that only wants text.
 *
 * The descriptor arrives as opaque proto3-JSON; the host decodes it against its
 * own single copy of the generated types. See `ViewBlock`.
 */
export type ViewRenderer = (view: ViewBlock, block: Block) => ReactNode;

export function BlockView({
  block,
  renderView,
}: {
  block: Block;
  renderView?: ViewRenderer;
}): ReactNode {
  if (block.markdown) {
    // mdInline escapes the text first, then adds a small safe tag set.
    return <div className="md" dangerouslySetInnerHTML={{ __html: mdInline(block.markdown.text || "") }} />;
  }
  if (block.context) {
    return (
      <div className="ctx">
        {block.context.icon ? block.context.icon + " " : ""}
        {block.context.text}
      </div>
    );
  }
  if (block.tool) {
    const t = block.tool;
    const err = t.state === "ERROR";
    return (
      <div className={"tool" + (err ? " err" : "")}>
        {t.state === "RUNNING" ? <span className="spin" /> : <span className={"dot " + (err ? "err" : "ok")} />}
        <span className="tname">{t.name}</span>
        {t.argsJson && t.argsJson !== "{}" ? <span className="targs"> {t.argsJson}</span> : null}
        {t.summary ? <> — {t.summary}</> : null}
      </div>
    );
  }
  if (block.list) {
    return (
      <div className="list">
        {block.list.title ? <div className="lhead">{block.list.title}</div> : null}
        {(block.list.items || []).map((it, i) => (
          <div className="litem" key={i}>
            <span className="ltitle">{it.title}</span>
            {it.subtitle ? <span className="lsub"> {it.subtitle}</span> : null}
            <span className="lbadges">
              {(it.badges || []).map((b, j) => (
                <span className="badge" key={j}>
                  {b}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (block.fields) {
    return (
      <div className="fields">
        {(block.fields.fields || []).map((f, i) => (
          <Fragment key={i}>
            <div className="k">{f.key}</div>
            <div>{f.value}</div>
          </Fragment>
        ))}
      </div>
    );
  }
  if (block.code) return <pre className="code">{block.code.text}</pre>;
  if (block.table) {
    const cols = block.table.columns || [];
    return (
      <table className="tbl">
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i}>{c.label || c.key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(block.table.rows || []).map((r, i) => (
            <tr key={i}>
              {cols.map((c, j) => (
                <td key={j}>{(r.cells || {})[c.key || ""] || ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (block.divider) return <hr className="div" />;
  // No host renderer: preserve a readable degradation instead of silently
  // dropping a composed view (including a chart) from the transcript.
  if (block.view) {
    if (renderView) return renderView(block.view, block);
    const title = typeof block.view.title === "string" ? block.view.title : "View";
    const id = typeof block.view.id === "string" ? block.view.id : "";
    return <div className="ctx">{title}{id && id !== title ? ` (${id})` : ""} — view renderer unavailable</div>;
  }
  return null;
}
