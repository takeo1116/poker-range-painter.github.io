import { CardId, CellState } from "../types";
import { SUIT_SYMBOLS } from "../utils/combos";
import { getComboDetails } from "../utils/calculations";

type Props = {
  editing: boolean;
  onSelect: () => void;
  cellKey: string;
  cellState: CellState;
  board: CardId[];
  isHighlighted: boolean;
  isPreview: boolean;
  isInspected: boolean;
  onInspect: () => void;
};

export function Cell({ editing, onSelect, cellKey, cellState, board, isHighlighted, isPreview, isInspected, onInspect }: Props) {
  const combos = getComboDetails(cellKey, cellState, board);
  const value = combos.filter((c) => c.state === "value").length;
  const bluff = combos.filter((c) => c.state === "bluff").length;
  const blocked = combos.filter((c) => c.state === "blocked").length;
  const summary = `${cellKey}: Value ${value}, Bluff ${bluff}, 使用不可 ${blocked}, 全${combos.length}コンボ`;
  const isSuited = cellKey.endsWith("s");

  return (
    <div
      className={`cell cell-${value && bluff ? "mixed" : value ? "value" : bluff ? "bluff" : "excluded"} ${isHighlighted ? "cell-highlighted" : ""} ${isPreview ? "cell-preview" : ""} ${isInspected ? "cell-inspected" : ""}`}
      style={{ background: `linear-gradient(to right, #17394f 0%, #17394f ${value / combos.length * 100}%, #4d2528 ${value / combos.length * 100}%, #4d2528 ${(value + bluff) / combos.length * 100}%, #2a2a2a ${(value + bluff) / combos.length * 100}%)` }}
      data-cell-key={cellKey} tabIndex={0} aria-label={summary}
      role={editing ? "button" : undefined} aria-pressed={editing ? isInspected : undefined}
      onClick={() => { if (editing) onSelect(); }}
      onKeyDown={(event) => {
        if (editing && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSelect();
        }
      }}
      onPointerEnter={onInspect} onFocus={onInspect}
    >
      <div className="cell-label">{cellKey}</div>
      <div className={isSuited ? "suit-results" : "combo-bar"} aria-hidden="true">
        {combos.map((combo) => (
          <span key={combo.id} className={`combo-result result-${combo.state}`}>
            {isSuited ? SUIT_SYMBOLS[combo.id[1]] : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
