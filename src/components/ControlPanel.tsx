import { PaintMode, FlagMode, SelectionMode } from "../types";
import { FlagPalette } from "./FlagPalette";

type Props = {
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
        <h4>塗り方</h4>
        <div className="button-group">
          <button aria-pressed={selectionMode === "brush"} className={selectionMode === "brush" ? "active" : ""} onClick={() => onSelectionModeChange("brush")}>ドラッグ</button>
          <button aria-pressed={selectionMode === "rectangle"} className={selectionMode === "rectangle" ? "active" : ""} onClick={() => onSelectionModeChange("rectangle")}>矩形</button>
        </div>
      </div>
      <p className="paint-help">左ドラッグで上書き、右ドラッグで消去。Shift併用で矩形指定、Escでキャンセル。</p>
      {flagMode !== "off" && paintMode !== "exclude" && !selectedFlagId && (
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

      <div className="control-section">
        <h4>Flag モード</h4>
        <div className="button-group">
          <button
            className={flagMode === "off" ? "active" : ""}
            onClick={() => onFlagModeChange("off")}
          >
            OFF
          </button>
          <button
            className={flagMode === "only" ? "active" : ""}
            onClick={() => onFlagModeChange("only")}
          >
            ONLY
          </button>
          <button
            className={flagMode === "except" ? "active" : ""}
            onClick={() => onFlagModeChange("except")}
          >
            EXCEPT
          </button>
        </div>
      </div>

      {flagMode !== "off" && (
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
