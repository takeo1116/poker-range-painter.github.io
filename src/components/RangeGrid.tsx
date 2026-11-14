import { useState, useRef, useEffect, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { CellState, Player, Street, SelectionMode, CardId, PaintOperation, BaseState } from "../types";
import { ReferenceRange } from "../data/referenceRanges";
import { getCellKeyAt } from "../utils/rangeMatrix";
import { Cell } from "./Cell";
import { applyPaint } from "../utils/painting";
import { ComboInspector } from "./ComboInspector";

type Props = {
  active?: boolean;
  onActivate?: () => void;
  renderInspector?: (panel: ReactNode) => ReactNode;
  comboEditing: boolean;
  player: Player;
  selectionMode: SelectionMode;
  paintState: PaintOperation | null;
  detailPaint: BaseState;
  currentStreet: Street;
  cells: Record<string, CellState>;
  board: CardId[];
  onDragPaint: (cellKeys: string[], paint: PaintOperation) => void;
  onCopyFromPrevious: () => void;
  onClear: () => void;
  referenceRanges: ReferenceRange[];
  selectedReferenceRangeId: string | null;
  onReferenceRangeChange: (rangeId: string | null) => void;
};

export function RangeGrid({
  active = true,
  onActivate = () => {},
  renderInspector = (panel) => panel,
  comboEditing,
  player,
  selectionMode,
  paintState,
  detailPaint,
  currentStreet,
  cells,
  board,
  onDragPaint,
  onCopyFromPrevious,
  onClear,
  referenceRanges,
  selectedReferenceRangeId,
  onReferenceRangeChange,
}: Props) {
  const [showCall, setShowCall] = useState(true);
  const [showRaise, setShowRaise] = useState(true);
  const [inspectedKey, setInspectedKey] = useState("AKs");
  const gridRef = useRef<HTMLDivElement>(null);
  // captureで外側のリリースも受け取る。確定前の変更はプレビュー内に閉じ、Undoは1手にまとめる。
  const gesture = useRef<{
    pointerId: number; start: [number, number]; last: [number, number] | null;
    rectangle: boolean; keys: Set<string>; paint: PaintOperation;
  } | null>(null);
  const [preview, setPreview] = useState<{ keys: Set<string>; paint: PaintOperation } | null>(null);

  const cancel = () => {
    const active = gesture.current;
    gesture.current = null;
    setPreview(null);
    if (active && gridRef.current?.hasPointerCapture(active.pointerId)) {
      gridRef.current.releasePointerCapture(active.pointerId);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!gesture.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      } else if (event.ctrlKey || event.metaKey) {
        // 履歴操作の前に未確定のプレビューを破棄する。
        cancel();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", cancel);
    };
  }, []);

  // モード切替時に未確定の塗りを破棄し、編集モードへ持ち越さない。
  useEffect(() => { cancel(); }, [comboEditing]);
  // 非アクティブ化時のみ中断する。塗り始めてアクティブになった側は継続する。
  useEffect(() => { if (!active) cancel(); }, [active]);

  const position = (event: ReactPointerEvent<HTMLDivElement>): [number, number] | null => {
    const grid = gridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    const style = getComputedStyle(grid);
    const x = event.clientX - rect.left - parseFloat(style.paddingLeft) - parseFloat(style.borderLeftWidth);
    const y = event.clientY - rect.top - parseFloat(style.paddingTop) - parseFloat(style.borderTopWidth);
    const cell = grid.firstElementChild as HTMLElement;
    const stepX = cell.getBoundingClientRect().width + parseFloat(style.columnGap || "0");
    const stepY = cell.getBoundingClientRect().height + parseFloat(style.rowGap || "0");
    const col = Math.floor(x / stepX);
    const row = Math.floor(y / stepY);
    if (x < 0 || y < 0 || x > 13 * stepX - parseFloat(style.columnGap || "0") ||
        y > 13 * stepY - parseFloat(style.rowGap || "0") || row > 12 || col > 12) return null;
    return [row, col];
  };

  const update = (point: [number, number] | null) => {
    const active = gesture.current;
    if (!active) return;
    if (!point) {
      // グリッド外の区間は補完せず、再入場したセルから再開する。
      active.last = null;
      return;
    }
    if (active.rectangle) {
      active.keys = new Set();
      for (let row = Math.min(active.start[0], point[0]); row <= Math.max(active.start[0], point[0]); row++) {
        for (let col = Math.min(active.start[1], point[1]); col <= Math.max(active.start[1], point[1]); col++) {
          active.keys.add(getCellKeyAt(row, col));
        }
      }
    } else {
      // 高速移動でイベント間のセルが飛ばされても、直前の位置との間を補完する。
      const from = active.last || point;
      const steps = Math.max(Math.abs(point[0] - from[0]), Math.abs(point[1] - from[1]), 1);
      for (let i = 0; i <= steps; i++) {
        active.keys.add(getCellKeyAt(
          Math.round(from[0] + (point[0] - from[0]) * i / steps),
          Math.round(from[1] + (point[1] - from[1]) * i / steps),
        ));
      }
    }
    setInspectedKey(getCellKeyAt(point[0], point[1]));
    active.last = point;
    setPreview({ keys: new Set(active.keys), paint: active.paint });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (comboEditing) return;
    if ((event.button !== 0 && event.button !== 2) || !event.isPrimary || gesture.current) return;
    // 右ボタンは一時的な消しゴム。選択中の色・Flagを変えず、条件未選択でも消去できる。
    const paint: PaintOperation | null = event.button === 2
      ? { state: "excluded", mode: "off", flagId: null }
      : paintState;
    if (!paint) return;
    const point = position(event);
    if (!point) return;
    event.preventDefault();
    onActivate();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      pointerId: event.pointerId, start: point, last: point,
      rectangle: selectionMode === "rectangle" || event.shiftKey,
      keys: new Set(), paint,
    };
    update(point);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointerId !== event.pointerId) return;
    update(position(event));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointerId !== event.pointerId) return;
    update(position(event));
    const keys = [...gesture.current.keys];
    const paint = gesture.current.paint;
    cancel();
    onDragPaint(keys, paint);
  };


  // コピー可能かチェック（preはコピー不可）
  const canCopy = currentStreet !== "pre";

  // 選択中の参照レンジのセル集合
  const selectedRange = selectedReferenceRangeId
    ? referenceRanges.find((r) => r.id === selectedReferenceRangeId)
    : null;
  const callCells = new Set(selectedRange?.groups.call || []);
  const raiseCells = new Set(selectedRange?.groups.raise || []);

  return (
    <div className={`range-grid-container ${comboEditing ? "combo-editing" : ""}`}>
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
                {range.name}
              </option>
            ))}
          </select>
          {selectedRange && (
            <div className="reference-visibility" role="group" aria-label="参照枠の表示切替">
              <button type="button" className="reference-toggle reference-toggle-call"
                aria-label="Callの参照枠を表示" aria-pressed={showCall}
                title="Callの参照枠を表示／非表示" disabled={!callCells.size}
                onClick={() => setShowCall(!showCall)}><span aria-hidden="true" /></button>
              <button type="button" className="reference-toggle reference-toggle-raise"
                aria-label="Raiseの参照枠を表示" aria-pressed={showRaise}
                title="Raiseの参照枠を表示／非表示" disabled={!raiseCells.size}
                onClick={() => setShowRaise(!showRaise)}><span aria-hidden="true" /></button>
            </div>
          )}
        </div>
      </div>
      <div className="range-grid" ref={gridRef}
        aria-label={player === "hero" ? "Heroのレンジ" : "Villainのレンジ"}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp} onPointerCancel={cancel} onLostPointerCapture={cancel}
      >
        {Array.from({ length: 13 }).map((_, row) =>
          Array.from({ length: 13 }).map((_, col) => {
            const cellKey = getCellKeyAt(row, col);
            const cellState = preview?.keys.has(cellKey) ? applyPaint(cellKey, cells[cellKey], preview.paint) : cells[cellKey];

            return (
              <Cell
                key={cellKey}
                cellKey={cellKey}
                cellState={cellState}
                board={board}
                isInspected={active && inspectedKey === cellKey}
                onInspect={() => { if (!comboEditing) { setInspectedKey(cellKey); onActivate(); } }}
                editing={comboEditing}
                onSelect={() => { if (comboEditing) { setInspectedKey(cellKey); onActivate(); } }}
                referenceCall={showCall && callCells.has(cellKey)}
                referenceRaise={showRaise && raiseCells.has(cellKey)}
                isPreview={preview?.keys.has(cellKey) ?? false}
              />
            );
          })
        )}
      </div>
      <div className="selection-status" aria-live="polite">
        {comboEditing ? inspectedKey + "を編集中 · 別のセルをクリックして変更" : preview ? preview.keys.size + (preview.paint.state === "excluded" ? "セル消去中" : "セル選択中") + " · 離して確定 / Escでキャンセル" : "左で塗る · 右で消す · Shiftで矩形指定"}
      </div>
      {renderInspector(<ComboInspector editing={comboEditing} cellKey={inspectedKey}
        cellState={preview?.keys.has(inspectedKey) ? applyPaint(inspectedKey, cells[inspectedKey], preview.paint) : cells[inspectedKey]}
        onPaintCombo={(comboId, erase) => { if (comboEditing) onDragPaint([inspectedKey], { state: erase ? "excluded" : detailPaint, mode: "off", flagId: null, comboId }); }}
        board={board} isPreview={preview?.keys.has(inspectedKey) ?? false} />)}
      <div className="grid-footer">
        <button className="copy-button" onClick={onCopyFromPrevious} disabled={!canCopy}>
          前ストリートをコピー
        </button>
        <button className="range-clear-button" onClick={onClear}>
          クリア
        </button>
      </div>
    </div>
  );
}
