import { ReferenceRange, ReferenceGroup } from "../utils/referenceRanges";
import { generateCellKeys, getCellKeyAt } from "../utils/rangeMatrix";

export type EditorAction = "add" | "remove" | "clear";
export type Point = [number, number];
const order = generateCellKeys();

export function paintReferenceRange(before: ReferenceRange, keys: string[], group: ReferenceGroup, action: EditorAction): ReferenceRange {
  const call = new Set(before.groups.call), raise = new Set(before.groups.raise);
  const target = group === "call" ? call : raise;
  for (const key of keys) {
    if (!order.includes(key)) continue;
    if (action === "clear") { call.delete(key); raise.delete(key); }
    else if (action === "remove") target.delete(key);
    else target.add(key);
  }
  const groups: ReferenceRange["groups"] = {};
  if (before.groups.call || call.size) groups.call = order.filter(key => call.has(key));
  if (before.groups.raise || raise.size) groups.raise = order.filter(key => raise.has(key));
  return { ...before, groups };
}

export function selectedKeys(start: Point, end: Point, rectangle: boolean): string[] {
  const keys: string[] = [];
  if (rectangle) {
    for (let row = Math.min(start[0], end[0]); row <= Math.max(start[0], end[0]); row++) {
      for (let col = Math.min(start[1], end[1]); col <= Math.max(start[1], end[1]); col++) keys.push(getCellKeyAt(row, col));
    }
  } else {
    const steps = Math.max(Math.abs(end[0] - start[0]), Math.abs(end[1] - start[1]), 1);
    for (let i = 0; i <= steps; i++) keys.push(getCellKeyAt(
      Math.round(start[0] + (end[0] - start[0]) * i / steps),
      Math.round(start[1] + (end[1] - start[1]) * i / steps)));
  }
  return [...new Set(keys)];
}

export type EditorHistory = { past: ReferenceRange[]; present: ReferenceRange; future: ReferenceRange[] };
export type HistoryAction = { type: "change"; document: ReferenceRange } | { type: "undo" | "redo" };
export function editorHistory(state: EditorHistory, action: HistoryAction): EditorHistory {
  if (action.type === "change") {
    if (JSON.stringify(state.present) === JSON.stringify(action.document)) return state;
    return { past: [...state.past, state.present].slice(-100), present: action.document, future: [] };
  }
  if (action.type === "undo" && state.past.length) return {
    past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future],
  };
  if (action.type === "redo" && state.future.length) return {
    past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1),
  };
  return state;
}
