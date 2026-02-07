// ランク順（A→2）
export const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

// セルキー生成（13×13グリッド）
export function generateCellKeys(): string[] {
  const keys: string[] = [];
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const rank1 = RANKS[row];
      const rank2 = RANKS[col];

      if (row === col) {
        // 対角線：ポケットペア
        keys.push(`${rank1}${rank2}`);
      } else if (row < col) {
        // 対角線上：suited
        keys.push(`${rank1}${rank2}s`);
      } else {
        // 対角線下：offsuit（大きい方が先）
        keys.push(`${rank2}${rank1}o`);
      }
    }
  }
  return keys;
}

// セルキーからグリッド座標を取得
export function getCellPosition(cellKey: string): { row: number; col: number } {
  const isSuited = cellKey.endsWith("s");
  const isOffsuit = cellKey.endsWith("o");
  const isPair = !isSuited && !isOffsuit;

  let rank1: string, rank2: string;

  if (isPair) {
    rank1 = cellKey[0];
    rank2 = cellKey[1];
  } else {
    rank1 = cellKey[0];
    rank2 = cellKey[1];
  }

  const row = RANKS.indexOf(rank1);
  const col = RANKS.indexOf(rank2);

  return { row, col };
}

// グリッド座標からセルキーを取得
export function getCellKeyAt(row: number, col: number): string {
  const rank1 = RANKS[row];
  const rank2 = RANKS[col];

  if (row === col) {
    return `${rank1}${rank2}`;
  } else if (row < col) {
    return `${rank1}${rank2}s`;
  } else {
    return `${rank2}${rank1}o`;
  }
}
