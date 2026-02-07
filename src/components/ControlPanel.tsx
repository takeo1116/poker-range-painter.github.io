import { PaintMode, FlagMode } from "../types";
import { FlagPalette } from "./FlagPalette";

type Props = {
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
