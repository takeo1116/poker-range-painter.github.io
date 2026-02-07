import { useState } from "react";
import { CellState, Player, Street } from "../types";
import { getCellKeyAt } from "../utils/rangeMatrix";
import { Cell } from "./Cell";

type Props = {
  player: Player;
  currentStreet: Street;
  cells: Record<string, CellState>;
  onDragPaint: (cellKeys: string[]) => void;
  onCopyFromPrevious: () => void;
};

export function RangeGrid({
  player,
  currentStreet,
  cells,
  onDragPaint,
  onCopyFromPrevious,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCells, setDraggedCells] = useState<Set<string>>(new Set());

  const handleMouseDown = (cellKey: string) => {
    setIsDragging(true);
    setDraggedCells(new Set([cellKey]));
  };

  const handleMouseEnter = (cellKey: string) => {
    if (isDragging) {
      setDraggedCells((prev) => new Set([...prev, cellKey]));
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      onDragPaint([...draggedCells]);
      setIsDragging(false);
      setDraggedCells(new Set());
    }
  };

  // コピー可能かチェック（preはコピー不可）
  const canCopy = currentStreet !== "pre";

  return (
    <div className="range-grid-container" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="grid-header">
        {player === "hero" && canCopy && (
          <button className="copy-button" onClick={onCopyFromPrevious}>
            前ストリートをコピー
          </button>
        )}
        <h3 className="player-title">{player === "hero" ? "Hero" : "Villain"}</h3>
        {player === "villain" && canCopy && (
          <button className="copy-button" onClick={onCopyFromPrevious}>
            前ストリートをコピー
          </button>
        )}
      </div>
      <div className="range-grid">
        {Array.from({ length: 13 }).map((_, row) =>
          Array.from({ length: 13 }).map((_, col) => {
            const cellKey = getCellKeyAt(row, col);
            const cellState = cells[cellKey];
            return (
              <Cell
                key={cellKey}
                cellKey={cellKey}
                cellState={cellState}
                onMouseDown={() => handleMouseDown(cellKey)}
                onMouseEnter={() => handleMouseEnter(cellKey)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
