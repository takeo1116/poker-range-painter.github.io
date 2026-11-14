import { useState, useRef, useEffect, PointerEvent } from "react";
import { ReferenceRange, ReferenceGroup } from "../utils/referenceRanges";
import { generateCellKeys } from "../utils/rangeMatrix";
import { ReferenceOutline } from "../components/ReferenceOutline";
import { EditorAction, Point, selectedKeys, paintReferenceRange } from "./referenceEditorModel";

type Props = {
  document: ReferenceRange; group: ReferenceGroup; action: EditorAction; rectangle: boolean;
  onCommit: (document: ReferenceRange) => void;
};
export function ReferenceEditorGrid({ document, group, action, rectangle, onCommit }: Props) {
  const grid = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    pointer: number; before: ReferenceRange; group: ReferenceGroup; action: EditorAction;
    start: Point; last: Point | null; rectangle: boolean; keys: Set<string>;
  } | null>(null);
  const [preview, setPreview] = useState<ReferenceRange | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const cancel = () => {
    const old = gesture.current;
    gesture.current = null;
    setPreview(null);
    setSelected(new Set());
    if (old && grid.current?.hasPointerCapture(old.pointer)) grid.current.releasePointerCapture(old.pointer);
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.ctrlKey || event.metaKey) cancel();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("blur", cancel);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("blur", cancel); };
  }, []);
  useEffect(() => { cancel(); }, [document, group, action, rectangle]);

  const position = (event: PointerEvent<HTMLDivElement>): Point | null => {
    if (!grid.current) return null;
    const rect = grid.current.getBoundingClientRect(), style = getComputedStyle(grid.current);
    const cell = grid.current.firstElementChild!.getBoundingClientRect();
    const gapX = parseFloat(style.columnGap), gapY = parseFloat(style.rowGap);
    const x = event.clientX - rect.left - parseFloat(style.paddingLeft);
    const y = event.clientY - rect.top - parseFloat(style.paddingTop);
    if (x < 0 || y < 0 || x >= (cell.width + gapX) * 13 - gapX || y >= (cell.height + gapY) * 13 - gapY) return null;
    return [Math.floor(y / (cell.height + gapY)), Math.floor(x / (cell.width + gapX))];
  };
  const update = (point: Point | null) => {
    const g = gesture.current;
    if (!g) return;
    if (!point) { g.last = null; return; }
    if (g.rectangle) g.keys = new Set(selectedKeys(g.start, point, true));
    else selectedKeys(g.last || point, point, false).forEach(key => g.keys.add(key));
    g.last = point;
    setSelected(new Set(g.keys));
    setPreview(paintReferenceRange(g.before, [...g.keys], g.group, g.action));
  };
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || ![0, 2].includes(event.button) || gesture.current) return;
    const point = position(event);
    if (!point) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { pointer: event.pointerId, before: document, group, action: event.button === 2 ? "remove" : action,
      rectangle: rectangle || event.shiftKey, start: point, last: point, keys: new Set() };
    update(point);
  };
  const end = (event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointer !== event.pointerId) return;
    update(position(event));
    const g = gesture.current;
    const next = paintReferenceRange(g.before, [...g.keys], g.group, g.action);
    cancel();
    onCommit(next);
  };
  const shown = preview || document;
  return <div className="range-grid reference-editor-grid" ref={grid}
    aria-label="参照レンジ作成用グリッド" onContextMenu={event => event.preventDefault()}
    onPointerDown={start} onPointerMove={event => {
      if (gesture.current?.pointer === event.pointerId) update(position(event));
    }} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={cancel}>
    {generateCellKeys().map(key => {
      const call = shown.groups.call?.includes(key) ?? false, raise = shown.groups.raise?.includes(key) ?? false;
      return <button type="button" key={key} className={`cell editor-cell ${selected.has(key) ? "cell-preview" : ""}`}
        aria-label={key + (call ? " Call" : "") + (raise ? " Raise" : "")}
        onClick={event => { if (event.detail === 0) onCommit(paintReferenceRange(document, [key], group, action)); }}>
        <ReferenceOutline call={call} raise={raise} /><span>{key}</span>
      </button>;
    })}
  </div>;
}
