# POKER RANGE PAINTER

テキサスホールデムのレンジ絞り込み練習用Webアプリ

## 機能

- 13×13のレンジ表を Value / Bluff / Exclude で塗り分け
- コンボ単位でValue／Bluffが共存。スート条件は「今回塗る対象」として指定
- 条件に一致／一致しないコンボだけ上書きし、対象外は維持
- 「コンボ編集」でセルをクリックして内訳を固定し、個別編集（右クリックで消去）
- 「塗る」では内訳はホバーに追従する閲覧専用表示
- Hero / Villain の2レンジ表を同時表示
- Pre / Flop / Turn / River の4ストリート切替
- クリック＋ドラッグで上書き塗り（高速移動の補完・プレビュー対応）
- 右クリック／右ドラッグで一時的に消去（選択中の色・Flagは維持）
- 矩形指定（ツール切替またはShift＋ドラッグ）、Escで操作をキャンセル
- Undo/Redo（Ctrl+Z / Ctrl+Y）
- コンボ数ベースでリアルタイム集計

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## デプロイ

mainブランチにpushすると、GitHub Actionsが自動でGitHub Pagesにデプロイします。

公開URL: https://takeo1116.github.io/poker-range-painter.github.io/

## 技術スタック

- Vite
- React
- TypeScript

## 部分塗りの例

「塗る対象：条件に一致」で♠♠をValue、その後♥♥をBluffで同じAKsに塗ると、両方の分類が共存します。Excludeも選択条件の部分だけを消します。右ドラッグは条件に関係なくセル全体を消します。ボードと重複するコンボは集計から外れますが、分類は保持されます。

テストは `npm test` で実行できます。
