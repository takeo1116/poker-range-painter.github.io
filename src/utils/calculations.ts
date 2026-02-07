import { BaseState, CellState, Override, Stats, CardId } from "../types";
import { generateCombosForCell, comboMatchesFlag } from "./combos";

// コンボの最終状態を計算（override適用後）
function getFinalStateForCombo(
  comboId: string,
  baseState: BaseState,
  override: Override
): "value" | "bluff" | "excluded" {
  if (!override) {
    // overrideなし：baseStateをそのまま返す
    return baseState;
  }

  if (override.mode === "only") {
    // ONLY：フラグ一致 → override.state、それ以外 → excluded
    if (comboMatchesFlag(comboId, override.flagId)) {
      return override.state;
    } else {
      return "excluded";
    }
  } else {
    // EXCEPT：フラグ一致 → excluded、それ以外 → baseState
    if (comboMatchesFlag(comboId, override.flagId)) {
      return "excluded";
    } else {
      return baseState;
    }
  }
}

// コンボがボードのカードと重複しているかチェック
function comboOverlapsWithBoard(comboId: string, board: CardId[]): boolean {
  // comboId形式: "AsKh" (4文字)
  const card1 = comboId.slice(0, 2); // "As"
  const card2 = comboId.slice(2, 4); // "Kh"

  return board.includes(card1) || board.includes(card2);
}

// セルの全コンボ状態を計算
export function calculateCellCombos(
  cellKey: string,
  cellState: CellState,
  board: CardId[] = []
): {
  valueCombos: number;
  bluffCombos: number;
} {
  const combos = generateCombosForCell(cellKey);
  let valueCombos = 0;
  let bluffCombos = 0;

  for (const comboId of combos) {
    // ボードと重複するコンボは除外
    if (comboOverlapsWithBoard(comboId, board)) {
      continue;
    }

    const finalState = getFinalStateForCombo(
      comboId,
      cellState.baseState,
      cellState.override
    );

    if (finalState === "value") {
      valueCombos++;
    } else if (finalState === "bluff") {
      bluffCombos++;
    }
  }

  return { valueCombos, bluffCombos };
}

// レンジ全体の集計（現在のストリート・プレイヤー）
export function calculateStats(cells: Record<string, CellState>, board: CardId[] = []): Stats {
  let valueCount = 0;
  let bluffCount = 0;

  for (const [cellKey, cellState] of Object.entries(cells)) {
    const { valueCombos, bluffCombos } = calculateCellCombos(cellKey, cellState, board);
    valueCount += valueCombos;
    bluffCount += bluffCombos;
  }

  const includedTotal = valueCount + bluffCount;

  let bluffToValueRatio: string;
  if (valueCount === 0) {
    bluffToValueRatio = bluffCount > 0 ? "∞" : "N/A";
  } else {
    bluffToValueRatio = (bluffCount / valueCount).toFixed(2);
  }

  let bluffPercent: string;
  if (includedTotal === 0) {
    bluffPercent = "N/A";
  } else {
    bluffPercent = ((bluffCount / includedTotal) * 100).toFixed(1) + "%";
  }

  return {
    valueCount,
    bluffCount,
    includedTotal,
    bluffToValueRatio,
    bluffPercent,
  };
}
