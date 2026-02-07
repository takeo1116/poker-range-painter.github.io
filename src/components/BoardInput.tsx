import { useState } from "react";
import { Street, CardId } from "../types";

type Props = {
  street: Street;
  board: CardId[];
  onBoardChange: (newBoard: CardId[]) => void;
  onCopyFromPrevious: () => void;
};

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = [
  { id: "s", color: "#000" },
  { id: "h", color: "#e53935" },
  { id: "d", color: "#1e88e5" },
  { id: "c", color: "#43a047" },
];

export function BoardInput({ street, board, onBoardChange, onCopyFromPrevious }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // ストリートごとの有効スロット数
  const activeSlotCount = street === "flop" ? 3 : street === "turn" ? 4 : street === "river" ? 5 : 0;

  // 常に5枠表示
  const totalSlots = 5;

  // スロットクリック
  const handleSlotClick = (index: number) => {
    // 無効なスロットはクリック不可
    if (index >= activeSlotCount) return;
    setSelectedSlot(index);
  };

  // カード選択
  const handleCardSelect = (cardId: CardId) => {
    if (selectedSlot === null) return;

    const newBoard = [...board];
    newBoard[selectedSlot] = cardId;
    onBoardChange(newBoard);
    setSelectedSlot(null);
  };

  // ボード全体をクリア
  const handleClearAll = () => {
    const newBoard = Array(totalSlots).fill("");
    onBoardChange(newBoard);
  };

  // 選択中のスロット以外をクリックしたら閉じる
  const handleOverlayClick = () => {
    setSelectedSlot(null);
  };

  // すでに使用されているカード
  const usedCards = new Set(board.filter((c) => c !== ""));

  const canCopy = street !== "flop" && street !== "pre";
  const canClear = street !== "pre";

  // カードIDからスートを取得
  const getSuitFromCard = (cardId: string): string => {
    if (!cardId) return "";
    return cardId[cardId.length - 1]; // 最後の文字がスート
  };

  // スートから色を取得
  const getSuitColor = (suit: string): string => {
    if (suit === "s") return "#000";
    if (suit === "h") return "#e53935";
    if (suit === "d") return "#1e88e5";
    if (suit === "c") return "#43a047";
    return "#888";
  };

  return (
    <div className="board-input">
      <div className="board-header">
        <span className="board-label">ボード:</span>
      </div>
      <div className="board-slots">
        {Array.from({ length: totalSlots }).map((_, index) => {
          const cardId = board[index] || "";
          const isActive = index < activeSlotCount;
          const suit = getSuitFromCard(cardId);
          const suitColor = getSuitColor(suit);

          // 3-4枠目の間と4-5枠目の間に広めのスペース
          const hasWideGap = index === 3 || index === 4;

          return (
            <div
              key={index}
              className={`board-slot ${isActive ? "" : "disabled"} ${cardId ? "filled" : ""} ${
                selectedSlot === index ? "selected" : ""
              } ${hasWideGap ? "wide-gap" : ""}`}
              onClick={() => handleSlotClick(index)}
            >
              {!isActive ? (
                <span className="board-slot-disabled">×</span>
              ) : cardId ? (
                <div
                  className="board-card-display"
                  style={{
                    backgroundColor: suitColor,
                    color: suit === "s" ? "#fff" : "#fff",
                  }}
                >
                  {cardId[0]}
                </div>
              ) : (
                <span className="board-slot-empty">?</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="board-buttons">
        <button
          className="board-action-button"
          onClick={onCopyFromPrevious}
          disabled={!canCopy}
        >
          前ストリートをコピー
        </button>
        <button
          className="board-action-button board-clear-button"
          onClick={handleClearAll}
          disabled={!canClear}
        >
          クリア
        </button>
      </div>

      {selectedSlot !== null && (
        <>
          <div className="card-selector-overlay" onClick={handleOverlayClick} />
          <div className="card-selector">
            {SUITS.map((suit) => (
              <div key={suit.id} className="card-selector-row">
                {RANKS.map((rank) => {
                  const cardId = `${rank}${suit.id}`;
                  const isUsed = usedCards.has(cardId);
                  return (
                    <button
                      key={cardId}
                      className={`card-selector-button ${isUsed ? "disabled" : ""}`}
                      style={{
                        backgroundColor: suit.color,
                        color: suit.id === "s" ? "#fff" : "#fff",
                      }}
                      onClick={() => !isUsed && handleCardSelect(cardId)}
                      disabled={isUsed}
                    >
                      {rank}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
