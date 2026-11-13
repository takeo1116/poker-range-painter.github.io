import { PaintMode, FlagMode, SelectionMode } from "../types";
import { FLAG_DEFINITIONS } from "../utils/combos";
import { FlagPalette } from "./FlagPalette";

type Props = {
  comboEditing: boolean;
  onComboEditingChange: (editing: boolean) => void;
  selectionMode: SelectionMode;
  onSelectionModeChange: (mode: SelectionMode) => void;
  paintMode: PaintMode;
  onPaintModeChange: (mode: PaintMode) => void;
  flagMode: FlagMode;
  onFlagModeChange: (mode: FlagMode) => void;
  selectedFlagId: string | null;
  onSelectFlag: (flagId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function ControlPanel({
  comboEditing, onComboEditingChange, selectionMode, onSelectionModeChange,
  paintMode, onPaintModeChange, flagMode, onFlagModeChange,
  selectedFlagId, onSelectFlag, canUndo, canRedo, onUndo, onRedo,
}: Props) {
  const flagLabel = FLAG_DEFINITIONS.find((flag) => flag.id === selectedFlagId)?.label;
  const targetLabel = flagMode === "off" ? "全コンボ"
    : flagLabel ? flagLabel + (flagMode === "only" ? "に一致" : "以外") : "条件未選択";
  return (
    <section className="control-panel" aria-label="操作パネル">
      <div className="tools-heading">
        <h2>編集ツール</h2>
        <div className="history-buttons">
          <button onClick={onUndo} disabled={!canUndo} title="元に戻す（Ctrl+Z）" aria-label="元に戻す">↶</button>
          <button onClick={onRedo} disabled={!canRedo} title="やり直す（Ctrl+Y）" aria-label="やり直す">↷</button>
        </div>
      </div>
      <div className="button-group mode-buttons" aria-label="操作モード">
        <button aria-pressed={!comboEditing} className={!comboEditing ? "active" : ""} onClick={() => onComboEditingChange(false)}>塗る</button>
        <button aria-pressed={comboEditing} className={comboEditing ? "active" : ""} onClick={() => onComboEditingChange(true)}>コンボ編集</button>
      </div>
      <div className="button-group paint-buttons" aria-label="塗る色">
        {(["value", "bluff", "exclude"] as PaintMode[]).map((mode) => (
          <button key={mode} aria-pressed={paintMode === mode}
            className={`paint-${mode} ${paintMode === mode ? "active" : ""}`}
            onClick={() => onPaintModeChange(mode)}>
            <span className="paint-dot" aria-hidden="true" />
            {mode === "value" ? "Value" : mode === "bluff" ? "Bluff" : "Exclude"}
          </button>
        ))}
      </div>
      {!comboEditing && (
        <details className="paint-options">
          <summary>塗り方・スート条件 <span>{selectionMode === "rectangle" ? "矩形" : "ドラッグ"} · {targetLabel}</span></summary>
          <div className="options-body">
            <div className="button-group">
              <button aria-pressed={selectionMode === "brush"} className={selectionMode === "brush" ? "active" : ""} onClick={() => onSelectionModeChange("brush")}>ドラッグ</button>
              <button aria-pressed={selectionMode === "rectangle"} className={selectionMode === "rectangle" ? "active" : ""} onClick={() => onSelectionModeChange("rectangle")}>矩形</button>
            </div>
            <label className="target-select">塗る対象
              <select value={flagMode} onChange={(event) => onFlagModeChange(event.target.value as FlagMode)}>
                <option value="off">全コンボ</option>
                <option value="only">条件に一致</option>
                <option value="except">条件に一致しない</option>
              </select>
            </label>
            {flagMode !== "off" && <FlagPalette selectedFlagId={selectedFlagId} onSelectFlag={onSelectFlag} />}
          </div>
        </details>
      )}
      {!comboEditing && flagMode !== "off" && !selectedFlagId && <p className="paint-warning" role="status">スート条件を選んでください。</p>}
      <p className="paint-help">{comboEditing
        ? "セルを選んで内訳を固定。下のコンボをクリックして塗ります。"
        : "左で部分塗り・右で全消去。Shiftで矩形、Escでキャンセル。"}</p>
    </section>
  );
}
