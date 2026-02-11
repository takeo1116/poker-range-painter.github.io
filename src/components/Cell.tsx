import { CellState } from "../types";
import { FLAG_DEFINITIONS } from "../utils/combos";
import { colorizeFlag } from "../utils/suitColors";

type Props = {
  cellKey: string;
  cellState: CellState;
  isHighlighted: boolean;
  onMouseDown: () => void;
  onMouseEnter: () => void;
};

export function Cell({ cellKey, cellState, isHighlighted, onMouseDown, onMouseEnter }: Props) {
  const { baseState, override } = cellState;

  // ベース背景色
  let bgClass = "cell-excluded";
  if (baseState === "value") bgClass = "cell-value";
  if (baseState === "bluff") bgClass = "cell-bluff";

  // オーバーライド表示
  let overrideHtml = null;
  let overrideClass = "";
  if (override) {
    const flag = FLAG_DEFINITIONS.find((f) => f.id === override.flagId);
    if (flag) {
      const isExcept = override.mode === "except";
      overrideHtml = colorizeFlag(flag.label, isExcept);
      overrideClass = isExcept ? "override-except" : "override-only";
    }
  }

  return (
    <div
      className={`cell ${bgClass} ${isHighlighted ? "cell-highlighted" : ""}`}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      <div className="cell-label">{cellKey}</div>
      {overrideHtml && (
        <div
          className={`cell-override ${overrideClass}`}
          dangerouslySetInnerHTML={overrideHtml}
        />
      )}
    </div>
  );
}
