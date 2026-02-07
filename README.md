# POKER RANGE PAINTER

テキサスホールデムのレンジ絞り込み練習用Webアプリ

## 機能

- 13×13のレンジ表を Value / Bluff / Exclude で塗り分け
- スート条件フラグによる例外指定（ONLY / EXCEPT）
- Hero / Villain の2レンジ表を同時表示
- Pre / Flop / Turn / River の4ストリート切替
- クリック＋ドラッグ塗り
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
