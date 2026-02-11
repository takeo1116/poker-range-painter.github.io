// プリセットレンジ定義
// id: 英数字とハイフン、label: 表示用（日本語可）、cells: セルキー配列

export type ReferenceRange = {
  id: string;
  label: string;
  cells: string[];
};

// id形式チェック（英数字とハイフンのみ）
function validateRangeId(id: string): boolean {
  return /^[a-zA-Z0-9-]+$/.test(id);
}

// セルキー妥当性チェック（AA, AKs, AKo形式）
function validateCellKey(cellKey: string): boolean {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  if (cellKey.length === 2) {
    // ペア（AA, KK, ...）
    return cellKey[0] === cellKey[1] && ranks.includes(cellKey[0]);
  } else if (cellKey.length === 3) {
    // スート付き（AKs, AKo）
    const rank1 = cellKey[0];
    const rank2 = cellKey[1];
    const suit = cellKey[2];

    // 3文字目はsまたはo
    if (suit !== 's' && suit !== 'o') return false;

    // 1文字目・2文字目が有効ランク
    if (!ranks.includes(rank1) || !ranks.includes(rank2)) return false;

    // 1文字目と2文字目が異なる（AAsのようなペア+s/oを無効）
    if (rank1 === rank2) return false;

    // 1文字目が2文字目より高ランク（常に高ランクが先）
    const idx1 = ranks.indexOf(rank1);
    const idx2 = ranks.indexOf(rank2);
    if (idx1 >= idx2) return false; // idx1 < idx2 である必要がある

    return true;
  }
  return false;
}

// 定義データ（記述順がUI表示順）
const rawReferenceRanges: ReferenceRange[] = [
  {
    id: 'btn-open',
    label: 'BTN Open',
    cells: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
      'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o',
      'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
      'QJo', 'QTo', 'Q9o',
      'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s',
      'JTo', 'J9o', 'J8o',
      'T9s', 'T8s', 'T7s', 'T6s', 'T5s',
      'T9o', 'T8o',
      '98s', '97s', '96s',
      '98o',
      '87s', '86s', '85s',
      '76s', '75s',
      '65s', '64s',
      '54s', '53s',
    ]
  },
];

// バリデーション付きエクスポート
export const referenceRanges: ReferenceRange[] = rawReferenceRanges.map(range => {
  if (!validateRangeId(range.id)) {
    console.warn(`[ReferenceRange] Invalid id format: ${range.id}`);
  }
  const validCells = range.cells.filter(cellKey => {
    const isValid = validateCellKey(cellKey);
    if (!isValid) {
      console.warn(`[ReferenceRange] Invalid cell key in "${range.label}": ${cellKey}`);
    }
    return isValid;
  });
  return {
    ...range,
    cells: validCells
  };
});
