import { CellState, FlagMode, PaintMode } from "../types";

// プレビューと確定で同じ上書き結果を使う。ExcludeはFlagモードに関係なくセル全体を消す。
export function getPaintState(
  paintMode: PaintMode, flagMode: FlagMode, flagId: string | null,
): CellState | null {
  if (paintMode === "exclude") return { baseState: "excluded", override: null };
  if (flagMode === "off") return { baseState: paintMode, override: null };
  if (!flagId) return null;
  return {
    baseState: paintMode,
    override: flagMode === "only"
      ? { flagId, mode: "only", state: paintMode }
      : { flagId, mode: "except" },
  };
}
