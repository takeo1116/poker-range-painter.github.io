// 基本状態
export type BaseState = "excluded" | "value" | "bluff";

// オーバーライド（フラグによる例外）
export type Override =
  | null
  | { flagId: string; mode: "only"; state: "value" | "bluff" }
  | { flagId: string; mode: "except" };

// セル状態
export type CellState = {
  baseState: BaseState;
  override: Override;
};

// ストリート
export type Street = "pre" | "flop" | "turn" | "river";

// プレイヤー
export type Player = "hero" | "villain";

// レンジ全体の状態（ストリート→プレイヤー→セルキー→セル状態）
export type RangeState = Record<
  Street,
  Record<Player, Record<string, CellState>>
>;

// Paintモード
export type PaintMode = "value" | "bluff" | "exclude";

// Flagモード
export type FlagMode = "off" | "only" | "except";

// フラグ定義
export type FlagDefinition = {
  id: string;
  label: string;
  category: "suited" | "upper" | "lower" | "twosuit";
};

// Undo/Redo用の差分
export type CellPatch = {
  cellKey: string;
  before: CellState;
  after: CellState;
};

export type HistoryEntry = {
  street: Street;
  player: Player;
  patches: CellPatch[];
};

// 集計結果
export type Stats = {
  valueCount: number;
  bluffCount: number;
  includedTotal: number;
  bluffToValueRatio: string; // "3.5" or "∞" or "N/A"
  bluffPercent: string; // "75.0%" or "N/A"
};

// カード（例: "As", "Kh"）
export type CardId = string;

// ボード状態（ストリートごとのカード配列）
export type BoardState = Record<Street, CardId[]>;

// 参照レンジ選択状態（プレイヤーごとに1つ選択可能）
export type ReferenceRangeSelection = Record<Player, string | null>;
