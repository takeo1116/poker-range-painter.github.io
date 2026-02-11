import { useState } from "react";
import { CellState, Player, Street } from "../types";
import { ReferenceRange } from "../data/referenceRanges";
import { getCellKeyAt } from "../utils/rangeMatrix";
import { Cell } from "./Cell";

type Props = {
  player: Player;
  currentStreet: Street;
  cells: Record<string, CellState>;
  onDragPaint: (cellKeys: string[]) => void;
  onCopyFromPrevious: () => void;
  onClear: () => void;
  referenceRanges: ReferenceRange[];
  selectedReferenceRangeId: string | null;
  onReferenceRangeChange: (rangeId: string | null) => void;
};

export function RangeGrid({
  player,
  currentStreet,
  cells,
  onDragPaint,
  onCopyFromPrevious,
  onClear,
  referenceRanges,
  selectedReferenceRangeId,
  onReferenceRangeChange,
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

  // 選択中の参照レンジのセル集合
  const selectedRange = selectedReferenceRangeId
    ? referenceRanges.find((r) => r.id === selectedReferenceRangeId)
    : null;
  const highlightedCells = new Set(selectedRange?.cells || []);

  return (
    <div className="range-grid-container" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="grid-header">
        <h3 className="player-title">{player === "hero" ? "Hero" : "Villain"}</h3>
        <div className="reference-range-selector">
          <label htmlFor={`ref-range-${player}`} className="reference-range-label">
            参照レンジ:
          </label>
          <select
            id={`ref-range-${player}`}
            className="reference-range-select"
            value={selectedReferenceRangeId || ""}
            onChange={(e) => onReferenceRangeChange(e.target.value || null)}
          >
            <option value="">なし</option>
            {referenceRanges.map((range) => (
              <option key={range.id} value={range.id}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="range-grid">
        {Array.from({ length: 13 }).map((_, row) =>
          Array.from({ length: 13 }).map((_, col) => {
            const cellKey = getCellKeyAt(row, col);
            const cellState = cells[cellKey];
            const isHighlighted = highlightedCells.has(cellKey);
            return (
              <Cell
                key={cellKey}
                cellKey={cellKey}
                cellState={cellState}
                isHighlighted={isHighlighted}
                onMouseDown={() => handleMouseDown(cellKey)}
                onMouseEnter={() => handleMouseEnter(cellKey)}
              />
            );
          })
        )}
      </div>
      <div className="grid-footer">
        <div className="grid-footer-left">
          {player === "hero" ? (
            <button className="copy-button" onClick={onCopyFromPrevious} disabled={!canCopy}>
              前ストリートをコピー
            </button>
          ) : (
            <button className="range-clear-button" onClick={onClear}>
              クリア
            </button>
          )}
        </div>
        <div className="grid-footer-right">
          {player === "villain" ? (
            <button className="copy-button" onClick={onCopyFromPrevious} disabled={!canCopy}>
              前ストリートをコピー
            </button>
          ) : (
            <button className="range-clear-button" onClick={onClear}>
              クリア
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
