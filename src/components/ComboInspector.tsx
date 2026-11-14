import { CardId, CellState } from "../types";
import { getComboDetails } from "../utils/calculations";
import { SUIT_SYMBOLS } from "../utils/combos";

type Props = { editing: boolean; cellKey: string; cellState: CellState; board: CardId[]; isPreview: boolean; onPaintCombo: (id: string, erase: boolean) => void };
const formatCombo = (id: string) => id[0] + SUIT_SYMBOLS[id[1]] + " " + id[2] + SUIT_SYMBOLS[id[3]];

export function ComboInspector({ editing, cellKey, cellState, board, isPreview, onPaintCombo }: Props) {
  const combos = getComboDetails(cellKey, cellState, board);
  const count = (state: string) => combos.filter((c) => c.state === state).length;
  return (
    <section className="combo-inspector" aria-label="コンボの内訳">
      <div className="inspector-heading">
        <strong>{cellKey} <small>{editing ? "を編集中（固定）" : isPreview ? "塗りのプレビュー" : "コンボの内訳"}</small></strong>
        <span>{count("value") + count("bluff")} / {combos.length} 採用</span>
      </div>
      <p className="inspector-condition">{editing ? "クリックで塗る · 右クリックで消す（条件は無視）" : "個別に塗るときは「コンボ編集」へ。"}</p>
      <div className="combo-legend">
        <span>Value {count("value")}</span><span>Bluff {count("bluff")}</span>
        <span>除外 {count("excluded")}</span><span>使用不可 {count("blocked")}</span>
      </div>
      <div className="combo-detail-grid">
        {combos.map((combo) => (
          <button type="button" key={combo.id} aria-label={formatCombo(combo.id) + " " + combo.reason} disabled={!editing || combo.state === "blocked"}
            onClick={() => { if (editing && combo.state !== "blocked") onPaintCombo(combo.id, false); }}
            onContextMenu={(event) => { event.preventDefault(); if (editing && combo.state !== "blocked") onPaintCombo(combo.id, true); }}
            className={`combo-detail result-${combo.state}`}>
            <strong className="combo-cards" aria-hidden="true">
              {[0, 2].map(offset => <span key={offset} className={`combo-card combo-card-${combo.id[offset + 1]}`}>
                {combo.id[offset]}<span>{SUIT_SYMBOLS[combo.id[offset + 1]]}</span>
              </span>)}
            </strong><small>{combo.reason}</small>
          </button>
        ))}
      </div>
      <p className="inspector-hint">{editing ? "表示対象は固定されています。別のセルをクリックすると編集対象が変わります。" : "セルにカーソルを合わせると内訳を表示。スート記号の背景色が分類を表します。"}</p>
    </section>
  );
}
