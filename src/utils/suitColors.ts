// スートごとの色を返す（CSSのcolor値）
export function getSuitColor(symbol: string, isExcept: boolean = false): string {
  if (symbol === "♠") return isExcept ? "#fff" : "#000";
  if (symbol === "♥") return "#e53935"; // 赤
  if (symbol === "♦") return "#1e88e5"; // 青
  if (symbol === "♣") return "#43a047"; // 緑
  if (symbol === "X") return "#888"; // 灰色
  return "#fff";
}

// フラグラベルをスパンで囲んでスタイル付けするJSX文字列を生成
export function colorizeFlag(label: string, isExcept: boolean = false): {
  __html: string;
} {
  let html = "";
  for (const char of label) {
    const color = getSuitColor(char, isExcept);
    html += `<span style="color: ${color}">${char}</span>`;
  }
  return { __html: html };
}
