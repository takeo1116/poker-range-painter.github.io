import { PaintMode, FlagMode, SelectionMode } from "../types";
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
  comboEditing,
  onComboEditingChange,
  selectionMode,
  onSelectionModeChange,
  paintMode,
  onPaintModeChange,
  flagMode,
  onFlagModeChange,
  selectedFlagId,
  onSelectFlag,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: Props) {
  return (
    <div className="control-panel">
      <div className="control-section">
        <h4>操作</h4>
        <div className="button-group">
          <button aria-pressed={!comboEditing} className={!comboEditing ? "active" : ""} onClick={() => onComboEditingChange(false)}>塗る</button>
          <button aria-pressed={comboEditing} className={comboEditing ? "active" : ""} onClick={() => onComboEditingChange(true)}>コンボ編集</button>
        </div>
      </div>
      {!comboEditing && <div className="control-section">
        <h4>塗り方</h4>
        <div className="button-group">
          <button aria-pressed={selectionMode === "brush"} className={selectionMode === "brush" ? "active" : ""} onClick={() => onSelectionModeChange("brush")}>ドラッグ</button>
          <button aria-pressed={selectionMode === "rectangle"} className={selectionMode === "rectangle" ? "active" : ""} onClick={() => onSelectionModeChange("rectangle")}>矩形</button>
        </div>
      </div>}
      <p className="paint-help">{comboEditing ? "セルをクリックして編集対象を固定。下の内訳をクリックして選択色で塗り、右クリックで消します。" : "左ドラッグは対象コンボだけ上書き（対象外は維持）。右ドラッグはセル全体を消去。Shiftで矩形、Escでキャンセル。"}</p>
      {!comboEditing && flagMode !== "off" && !selectedFlagId && (
        <p className="paint-warning" role="status">塗るスート条件を選んでください。</p>
      )}
      <div className="control-section">
        <h4>Paint モード</h4>
        <div className="button-group">
          <button
            className={paintMode === "value" ? "active" : ""}
            onClick={() => onPaintModeChange("value")}
          >
            Value
          </button>
          <button
            className={paintMode === "bluff" ? "active" : ""}
            onClick={() => onPaintModeChange("bluff")}
          >
            Bluff
          </button>
          <button
            className={paintMode === "exclude" ? "active" : ""}
            onClick={() => onPaintModeChange("exclude")}
          >
            Exclude
          </button>
        </div>
      </div>

      {!comboEditing && <div className="control-section">
        <h4>塗る対象</h4>
        <div className="button-group">
          <button
            className={flagMode === "off" ? "active" : ""}
            onClick={() => onFlagModeChange("off")}
          >
            全コンボ
          </button>
          <button
            className={flagMode === "only" ? "active" : ""}
            onClick={() => onFlagModeChange("only")}
          >
            条件に一致
          </button>
          <button
            className={flagMode === "except" ? "active" : ""}
            onClick={() => onFlagModeChange("except")}
          >
            条件に一致しない
          </button>
        </div>
      </div>}

      {!comboEditing && flagMode !== "off" && (
        <FlagPalette selectedFlagId={selectedFlagId} onSelectFlag={onSelectFlag} />
      )}

      <div className="control-section">
        <h4>Undo/Redo</h4>
        <div className="button-group">
          <button onClick={onUndo} disabled={!canUndo}>
            Undo (Ctrl+Z)
          </button>
          <button onClick={onRedo} disabled={!canRedo}>
            Redo (Ctrl+Y)
          </button>
        </div>
      </div>
    </div>
  );
}
