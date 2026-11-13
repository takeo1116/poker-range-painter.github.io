import { BaseState, CellState, Stats, CardId } from "../types";
import { generateCombosForCell } from "./combos";

// コンボがボードのカードと重複しているかチェック
function comboOverlapsWithBoard(comboId: string, board: CardId[]): boolean {
  // comboId形式: "AsKh" (4文字)
  const card1 = comboId.slice(0, 2); // "As"
  const card2 = comboId.slice(2, 4); // "Kh"

  return board.includes(card1) || board.includes(card2);
}

export type ComboDetail = {
  id: string;
  state: BaseState | "blocked";
  reason: string;
};

// 集計と表示で同じ判定を使い、ボードによる使用不可と手動の除外を区別する。
export function getComboDetails(cellKey: string, cellState: CellState, board: CardId[] = []): ComboDetail[] {
  return generateCombosForCell(cellKey).map((id) => {
    if (comboOverlapsWithBoard(id, board)) {
      return { id, state: "blocked", reason: "ボードと重複" };
    }
    const state = cellState.combos[id] ?? "excluded";
    return {
      id, state,
      reason: state === "excluded" ? "Exclude" : state === "value" ? "Value" : "Bluff",
    };
  });
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
  const details = getComboDetails(cellKey, cellState, board);
  const valueCombos = details.filter((combo) => combo.state === "value").length;
  const bluffCombos = details.filter((combo) => combo.state === "bluff").length;

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
