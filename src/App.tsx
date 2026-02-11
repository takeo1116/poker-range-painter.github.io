import { useState, useEffect } from "react";
import {
  Street,
  Player,
  RangeState,
  CellState,
  PaintMode,
  FlagMode,
  HistoryEntry,
  BoardState,
  CardId,
  ReferenceRangeSelection,
} from "./types";
import { generateCellKeys } from "./utils/rangeMatrix";
import { calculateStats } from "./utils/calculations";
import { referenceRanges } from "./data/referenceRanges";
import { StreetTabs } from "./components/StreetTabs";
import { RangeGrid } from "./components/RangeGrid";
import { ControlPanel } from "./components/ControlPanel";
import { StatsPanel } from "./components/StatsPanel";
import { BoardInput } from "./components/BoardInput";
import "./App.css";

// 初期状態生成
function createInitialRangeState(): RangeState {
  const cellKeys = generateCellKeys();
  const initialCells: Record<string, CellState> = {};
  for (const key of cellKeys) {
    initialCells[key] = { baseState: "excluded", override: null };
  }

  const rangeState: RangeState = {
    pre: { hero: { ...initialCells }, villain: { ...initialCells } },
    flop: { hero: { ...initialCells }, villain: { ...initialCells } },
    turn: { hero: { ...initialCells }, villain: { ...initialCells } },
    river: { hero: { ...initialCells }, villain: { ...initialCells } },
  };

  return rangeState;
}

function App() {
  const [rangeState, setRangeState] = useState<RangeState>(createInitialRangeState);
  const [currentStreet, setCurrentStreet] = useState<Street>("pre");
  const [paintMode, setPaintMode] = useState<PaintMode>("value");
  const [flagMode, setFlagMode] = useState<FlagMode>("off");
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);

  // ボード状態（常に5枠）
  const [boardState, setBoardState] = useState<BoardState>({
    pre: ["", "", "", "", ""],
    flop: ["", "", "", "", ""],
    turn: ["", "", "", "", ""],
    river: ["", "", "", "", ""],
  });

  // 参照レンジ選択状態
  const [referenceRangeSelection, setReferenceRangeSelection] =
    useState<ReferenceRangeSelection>({
      hero: null,
      villain: null,
    });

  // Undo/Redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ドラッグ塗り処理（プレイヤー指定版）
  const handleDragPaint = (player: Player, cellKeys: string[]) => {
    const patches: {
      cellKey: string;
      before: CellState;
      after: CellState;
    }[] = [];

    const newCells = { ...rangeState[currentStreet][player] };

    for (const cellKey of cellKeys) {
      const before = newCells[cellKey];
      let after: CellState;

      if (flagMode === "off") {
        // Flagモード OFF：同じbaseStateを上書き→Exclude、異なる→変更
        const targetBase = paintMode === "exclude" ? "excluded" : paintMode;
        if (before.baseState === targetBase && !before.override) {
          // 同じ状態を上書き→Excludeに変更
          after = { baseState: "excluded", override: null };
        } else {
          // 異なる状態→変更、overrideは解除
          after = { baseState: targetBase, override: null };
        }
      } else if (flagMode === "only") {
        // ONLY：ExcludeモードでもValue/Bluffを選択可能
        if (!selectedFlagId || paintMode === "exclude") continue;

        const existingOverride = before.override;
        const isSame =
          existingOverride &&
          existingOverride.mode === "only" &&
          existingOverride.flagId === selectedFlagId &&
          "state" in existingOverride &&
          existingOverride.state === paintMode;

        if (isSame) {
          // トグル：override解除、baseStateはExcludeに
          after = { baseState: "excluded", override: null };
        } else {
          // 適用：baseStateもpaintModeに変更
          after = {
            baseState: paintMode,
            override: { flagId: selectedFlagId, mode: "only", state: paintMode },
          };
        }
      } else {
        // EXCEPT
        if (!selectedFlagId || paintMode === "exclude") continue;

        const existingOverride = before.override;
        const isSame =
          existingOverride &&
          existingOverride.mode === "except" &&
          existingOverride.flagId === selectedFlagId;

        if (isSame) {
          // トグル：override解除、baseStateはExcludeに
          after = { baseState: "excluded", override: null };
        } else {
          // 適用：baseStateもpaintModeに変更
          after = {
            baseState: paintMode,
            override: { flagId: selectedFlagId, mode: "except" },
          };
        }
      }

      patches.push({ cellKey, before, after });
      newCells[cellKey] = after;
    }

    if (patches.length === 0) return;

    // 状態更新
    setRangeState((prev) => ({
      ...prev,
      [currentStreet]: {
        ...prev[currentStreet],
        [player]: newCells,
      },
    }));

    // 履歴追加
    const newEntry: HistoryEntry = {
      street: currentStreet,
      player: player,
      patches,
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex < 0) return;

    const entry = history[historyIndex];
    const newCells = { ...rangeState[entry.street][entry.player] };

    for (const patch of entry.patches) {
      newCells[patch.cellKey] = patch.before;
    }

    setRangeState((prev) => ({
      ...prev,
      [entry.street]: {
        ...prev[entry.street],
        [entry.player]: newCells,
      },
    }));

    setHistoryIndex(historyIndex - 1);
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;

    const entry = history[historyIndex + 1];
    const newCells = { ...rangeState[entry.street][entry.player] };

    for (const patch of entry.patches) {
      newCells[patch.cellKey] = patch.after;
    }

    setRangeState((prev) => ({
      ...prev,
      [entry.street]: {
        ...prev[entry.street],
        [entry.player]: newCells,
      },
    }));

    setHistoryIndex(historyIndex + 1);
  };

  // 前ストリートからコピー
  const handleCopyFromPrevious = (player: Player) => {
    const streetOrder: Street[] = ["pre", "flop", "turn", "river"];
    const currentIndex = streetOrder.indexOf(currentStreet);
    if (currentIndex <= 0) return; // preはコピー不可

    const previousStreet = streetOrder[currentIndex - 1];
    const previousCells = rangeState[previousStreet][player];
    const currentCells = rangeState[currentStreet][player];

    // 全セルのパッチを作成
    const patches: {
      cellKey: string;
      before: CellState;
      after: CellState;
    }[] = [];

    for (const cellKey in currentCells) {
      patches.push({
        cellKey,
        before: currentCells[cellKey],
        after: previousCells[cellKey],
      });
    }

    // 状態更新
    setRangeState((prev) => ({
      ...prev,
      [currentStreet]: {
        ...prev[currentStreet],
        [player]: { ...previousCells },
      },
    }));

    // 履歴追加
    const newEntry: HistoryEntry = {
      street: currentStreet,
      player: player,
      patches,
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // レンジをクリア
  const handleRangeClear = (player: Player) => {
    const cellKeys = generateCellKeys();
    const patches: {
      cellKey: string;
      before: CellState;
      after: CellState;
    }[] = [];

    const currentCells = rangeState[currentStreet][player];
    const newCells: Record<string, CellState> = {};

    for (const cellKey of cellKeys) {
      const before = currentCells[cellKey];
      const after: CellState = { baseState: "excluded", override: null };
      patches.push({ cellKey, before, after });
      newCells[cellKey] = after;
    }

    // 状態更新
    setRangeState((prev) => ({
      ...prev,
      [currentStreet]: {
        ...prev[currentStreet],
        [player]: newCells,
      },
    }));

    // 履歴追加
    const newEntry: HistoryEntry = {
      street: currentStreet,
      player: player,
      patches,
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // ボード変更
  const handleBoardChange = (newBoard: CardId[]) => {
    setBoardState((prev) => ({
      ...prev,
      [currentStreet]: newBoard,
    }));
  };

  // ボードを前ストリートからコピー
  const handleBoardCopyFromPrevious = () => {
    const streetOrder: Street[] = ["pre", "flop", "turn", "river"];
    const currentIndex = streetOrder.indexOf(currentStreet);
    if (currentIndex <= 0) return;

    const previousStreet = streetOrder[currentIndex - 1];
    const previousBoard = boardState[previousStreet];

    // 前ストリートのカードを5枠分コピー
    const newBoard = [...previousBoard];

    setBoardState((prev) => ({
      ...prev,
      [currentStreet]: newBoard,
    }));
  };

  // 参照レンジ選択変更
  const handleReferenceRangeChange = (player: Player, rangeId: string | null) => {
    setReferenceRangeSelection((prev) => ({
      ...prev,
      [player]: rangeId,
    }));
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.ctrlKey && e.key === "y") || (e.metaKey && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIndex, history, rangeState]);

  // 集計計算
  const heroCells = rangeState[currentStreet].hero;
  const villainCells = rangeState[currentStreet].villain;
  const currentBoard = boardState[currentStreet].filter((c) => c !== "");
  const heroStats = calculateStats(heroCells, currentBoard);
  const villainStats = calculateStats(villainCells, currentBoard);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Range Painter</h1>
      </header>

      <StreetTabs currentStreet={currentStreet} onStreetChange={setCurrentStreet} />

      <BoardInput
        street={currentStreet}
        board={boardState[currentStreet]}
        onBoardChange={handleBoardChange}
        onCopyFromPrevious={handleBoardCopyFromPrevious}
      />

      <div className="main-content">
        <div className="grids-container">
          <RangeGrid
            player="hero"
            currentStreet={currentStreet}
            cells={heroCells}
            onDragPaint={(cellKeys) => handleDragPaint("hero", cellKeys)}
            onCopyFromPrevious={() => handleCopyFromPrevious("hero")}
            onClear={() => handleRangeClear("hero")}
            referenceRanges={referenceRanges}
            selectedReferenceRangeId={referenceRangeSelection.hero}
            onReferenceRangeChange={(rangeId) =>
              handleReferenceRangeChange("hero", rangeId)
            }
          />
          <RangeGrid
            player="villain"
            currentStreet={currentStreet}
            cells={villainCells}
            onDragPaint={(cellKeys) => handleDragPaint("villain", cellKeys)}
            onCopyFromPrevious={() => handleCopyFromPrevious("villain")}
            onClear={() => handleRangeClear("villain")}
            referenceRanges={referenceRanges}
            selectedReferenceRangeId={referenceRangeSelection.villain}
            onReferenceRangeChange={(rangeId) =>
              handleReferenceRangeChange("villain", rangeId)
            }
          />
        </div>

        <div className="stats-container">
          <StatsPanel player="hero" stats={heroStats} />
          <StatsPanel player="villain" stats={villainStats} />
        </div>
      </div>

      <ControlPanel
        paintMode={paintMode}
        onPaintModeChange={setPaintMode}
        flagMode={flagMode}
        onFlagModeChange={setFlagMode}
        selectedFlagId={selectedFlagId}
        onSelectFlag={setSelectedFlagId}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
    </div>
  );
}

export default App;
