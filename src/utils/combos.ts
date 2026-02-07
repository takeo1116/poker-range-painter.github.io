import { RANKS } from "./rangeMatrix";

// スート定義
export const SUITS = ["s", "h", "d", "c"]; // ♠ ♥ ♦ ♣
export const SUIT_SYMBOLS: Record<string, string> = {
  s: "♠",
  h: "♥",
  d: "♦",
  c: "♣",
};

// フラグ定義（CLAUDE.mdの順番通り）
export const FLAG_DEFINITIONS = [
  // 1. suited 4種
  { id: "ss", label: "♠♠", category: "suited" as const },
  { id: "hh", label: "♥♥", category: "suited" as const },
  { id: "dd", label: "♦♦", category: "suited" as const },
  { id: "cc", label: "♣♣", category: "suited" as const },
  // 2. 上側指定 4種
  { id: "sX", label: "♠X", category: "upper" as const },
  { id: "hX", label: "♥X", category: "upper" as const },
  { id: "dX", label: "♦X", category: "upper" as const },
  { id: "cX", label: "♣X", category: "upper" as const },
  // 3. 下側指定 4種
  { id: "Xs", label: "X♠", category: "lower" as const },
  { id: "Xh", label: "X♥", category: "lower" as const },
  { id: "Xd", label: "X♦", category: "lower" as const },
  { id: "Xc", label: "X♣", category: "lower" as const },
  // 4. 2スート組 6種
  { id: "sh", label: "♠♥", category: "twosuit" as const },
  { id: "sd", label: "♠♦", category: "twosuit" as const },
  { id: "sc", label: "♠♣", category: "twosuit" as const },
  { id: "hd", label: "♥♦", category: "twosuit" as const },
  { id: "hc", label: "♥♣", category: "twosuit" as const },
  { id: "dc", label: "♦♣", category: "twosuit" as const },
];

// コンボID（例: "AsKs", "AhKd"）
export type ComboId = string;

// セルキーから全コンボを生成
export function generateCombosForCell(cellKey: string): ComboId[] {
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

  const combos: ComboId[] = [];

  if (isPair) {
    // ペア：6コンボ
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        combos.push(`${rank1}${SUITS[i]}${rank2}${SUITS[j]}`);
      }
    }
  } else if (isSuited) {
    // suited：4コンボ
    for (const suit of SUITS) {
      combos.push(`${rank1}${suit}${rank2}${suit}`);
    }
  } else {
    // offsuit：12コンボ
    for (const suit1 of SUITS) {
      for (const suit2 of SUITS) {
        if (suit1 !== suit2) {
          combos.push(`${rank1}${suit1}${rank2}${suit2}`);
        }
      }
    }
  }

  return combos;
}

// コンボがフラグ条件に一致するか判定
export function comboMatchesFlag(comboId: ComboId, flagId: string): boolean {
  // comboId形式: "AsKs" or "AhKd" (4文字)
  const card1 = comboId.slice(0, 2); // "As"
  const card2 = comboId.slice(2, 4); // "Ks"

  const rank1 = card1[0];
  const suit1 = card1[1];
  const rank2 = card2[0];
  const suit2 = card2[1];

  // ランク順を確認（高ランク=rank1, 低ランク=rank2）
  const rank1Index = RANKS.indexOf(rank1);
  const rank2Index = RANKS.indexOf(rank2);

  let upperSuit: string, lowerSuit: string;
  if (rank1Index < rank2Index) {
    // rank1が高ランク
    upperSuit = suit1;
    lowerSuit = suit2;
  } else if (rank1Index > rank2Index) {
    // rank2が高ランク
    upperSuit = suit2;
    lowerSuit = suit1;
  } else {
    // ペア（同ランク）
    upperSuit = suit1;
    lowerSuit = suit2;
  }

  // フラグ判定
  if (flagId === "ss") return suit1 === "s" && suit2 === "s";
  if (flagId === "hh") return suit1 === "h" && suit2 === "h";
  if (flagId === "dd") return suit1 === "d" && suit2 === "d";
  if (flagId === "cc") return suit1 === "c" && suit2 === "c";

  if (flagId === "sX") return upperSuit === "s";
  if (flagId === "hX") return upperSuit === "h";
  if (flagId === "dX") return upperSuit === "d";
  if (flagId === "cX") return upperSuit === "c";

  if (flagId === "Xs") return lowerSuit === "s";
  if (flagId === "Xh") return lowerSuit === "h";
  if (flagId === "Xd") return lowerSuit === "d";
  if (flagId === "Xc") return lowerSuit === "c";

  // 2スート組（順不同）
  const suitSet = new Set([suit1, suit2]);
  if (flagId === "sh") return suitSet.has("s") && suitSet.has("h") && suitSet.size === 2;
  if (flagId === "sd") return suitSet.has("s") && suitSet.has("d") && suitSet.size === 2;
  if (flagId === "sc") return suitSet.has("s") && suitSet.has("c") && suitSet.size === 2;
  if (flagId === "hd") return suitSet.has("h") && suitSet.has("d") && suitSet.size === 2;
  if (flagId === "hc") return suitSet.has("h") && suitSet.has("c") && suitSet.size === 2;
  if (flagId === "dc") return suitSet.has("d") && suitSet.has("c") && suitSet.size === 2;

  return false;
}
