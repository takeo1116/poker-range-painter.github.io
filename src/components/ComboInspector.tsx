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
      <p className="inspector-condition">{editing ? "各コンボをクリックして選択色で塗る・右クリックで消す（スート条件は無視）" : "個別に塗るには、操作を「コンボ編集」に切り替えてください。"}</p>
      <div className="combo-legend">
        <span>青: Value {count("value")}</span><span>赤: Bluff {count("bluff")}</span>
        <span>暗色: 除外 {count("excluded")}</span><span>斜線: 使用不可 {count("blocked")}</span>
      </div>
      <div className="combo-detail-grid">
        {combos.map((combo) => (
          <button type="button" key={combo.id} disabled={!editing || combo.state === "blocked"}
            onClick={() => { if (editing && combo.state !== "blocked") onPaintCombo(combo.id, false); }}
            onContextMenu={(event) => { event.preventDefault(); if (editing && combo.state !== "blocked") onPaintCombo(combo.id, true); }}
            className={`combo-detail result-${combo.state}`}>
            <strong>{formatCombo(combo.id)}</strong><small>{combo.reason}</small>
          </button>
        ))}
      </div>
      <p className="inspector-hint">{editing ? "表示対象は固定されています。別のセルをクリックすると編集対象が変わります。" : "セルにカーソルを合わせると内訳を表示。スート記号の背景色が分類を表します。"}</p>
    </section>
  );
}
