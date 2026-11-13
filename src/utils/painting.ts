import { CellState, FlagMode, PaintMode, PaintOperation } from "../types";
import { generateCombosForCell, comboMatchesFlag } from "./combos";

export function getPaintState(
  paintMode: PaintMode, mode: FlagMode, flagId: string | null,
): PaintOperation | null {
  if (mode !== "off" && !flagId) return null;
  return { state: paintMode === "exclude" ? "excluded" : paintMode, mode, flagId };
}

// ボードは分類を書き換えない。使用不可は表示・集計時に判定する。
export function applyPaint(cellKey: string, before: CellState, operation: PaintOperation): CellState {
  const combos = { ...before.combos };
  let changed = false;
  for (const id of generateCombosForCell(cellKey)) {
    const selected = operation.comboId
      ? id === operation.comboId
      : operation.mode === "off" || (operation.flagId !== null &&
        comboMatchesFlag(id, operation.flagId) === (operation.mode === "only"));
    if (!selected || (combos[id] ?? "excluded") === operation.state) continue;
    changed = true;
    if (operation.state === "excluded") delete combos[id];
    else combos[id] = operation.state;
  }
  return changed ? { combos } : before;
}
