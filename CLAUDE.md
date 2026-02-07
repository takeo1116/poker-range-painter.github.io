# CLAUDE.md - 開発指針

このファイルは**安定ルール**（技術スタック・開発方針・受け入れ条件）のみを記載します。
**仕様詳細**（UI・操作・データモデル・集計・フラグなど）は **SPEC.md** を参照してください。

---

## 目的（Goal）

テキサスホールデムのレンジ絞り込み練習用の**静的Webアプリ**を提供する。

---

## 言語設定

- 常に日本語で会話する
- コメントも日本語で記述する
- エラーメッセージの説明も日本語で行う
- ドキュメントも日本語で生成する

---

## 技術スタック（変更不可）

### フロントエンド
- **Vite + React + TypeScript**
- バックエンドなし（完全フロント完結）
- 1ページ構成（ルーティングなし）
  - ストリート切替はUIタブで行い、URLパスは増やさない
  - リロードしても404にならない

### 状態管理
- React useState（Reduxなどの外部ライブラリは使用しない）

### ビルド・デプロイ
- Vite でビルド
- GitHub Pages で公開（サーバー不要）

---

## GitHub Pages 対応（重要）

### サブパス配信
GitHub Pagesはサブパス配信になるため、Viteの `base` 設定が必須。

**vite.config.ts**:
```ts
export default defineConfig({
  base: "/poker-range-painter.github.io/",
  plugins: [react()],
})
```

### 注意点
- 絶対パス参照（例：`/assets/...`）を避け、base に追従する形にする
- GitHub Actionsで自動デプロイ（`.github/workflows/deploy.yml`）

### 公開先
- **GitHubユーザー名**: `takeo1116`
- **リポジトリ名**: `poker-range-painter.github.io`
- **公開URL**: `https://takeo1116.github.io/poker-range-painter.github.io/`

---

## 開発の進め方

### 仕様変更の流れ
1. **SPEC.mdを更新**（変更したい仕様を記述）
2. **実装を修正**（SPEC.mdに従ってコードを変更）
3. **SPEC.mdを最終確認**（実装と完全一致するように調整）

### 原則
- **コードが正**ではなく、**SPEC.mdが正**
- 実装とドキュメントが矛盾したら、まずSPEC.mdを見直す
- 不明点はSPEC.mdのTODOセクションに記載
- SPEC.mdには変更履歴を記載しない

### 技術的制約
- 外部APIを使用しない
- データの永続化は行わない（ローカルストレージも使用しない）
- ブラウザのリロードで状態は初期化される

---

## 受け入れ条件（Acceptance Criteria）

以下をすべて満たすこと：

1. **起動**: `npm install && npm run dev` で起動できる
2. **操作**: SPEC.mdに記載された全操作が正しく動作する
3. **Undo/Redo**: キーボードショートカット（Ctrl+Z/Ctrl+Y）が動作する
4. **集計**: コンボ数ベースの集計が正しく更新される（フラグ考慮）
5. **ビルド**: `npm run build` が成功する
6. **GitHub Pages**: ビルド成果物が `https://takeo1116.github.io/poker-range-painter.github.io/` で正しく表示される
   - CSS/JSが欠けない（base設定が正しい）
   - リロードしても404にならない（ルーティングを使わない）

---

## デプロイ

### 自動デプロイ（推奨）
- GitHub Actions で `main` ブランチへのpush時に自動デプロイ
- ワークフローファイル: `.github/workflows/deploy.yml`

### 手動デプロイ（非推奨）
- `npm run build` で `dist/` を生成
- `dist/` を `gh-pages` ブランチに配置

---

## 実装推奨事項

### コード構造
- コンボ生成・フラグ判定はユーティリティとして分離（`src/utils/`）
- コンポーネントは責務ごとに分割（`src/components/`）
- 型定義は `src/types.ts` に集約

### パフォーマンス
- ドラッグ中はセル更新が多いため、必要に応じて描画最適化（React.memo等）を検討
- ただし、過度な最適化は避ける（premature optimization）

### スタイリング
- フラグ文字はフォント差があるため、CSSでサイズ/行高を調整
- スート色はSPEC.mdの定義に従う

### テスト
- ユーティリティ関数（コンボ生成、フラグ判定、集計）は単体テスト可能な設計にする
- ただし、テストコードの実装は必須ではない（今後の拡張として検討）

---

## ファイル構成（参考）

```
/
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions設定
├── src/
│   ├── main.tsx            # エントリーポイント
│   ├── App.tsx             # メインコンポーネント
│   ├── App.css             # スタイル
│   ├── types.ts            # 型定義
│   ├── components/         # UIコンポーネント
│   │   ├── StreetTabs.tsx
│   │   ├── RangeGrid.tsx
│   │   ├── Cell.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── FlagPalette.tsx
│   │   └── StatsPanel.tsx
│   └── utils/              # ユーティリティ
│       ├── rangeMatrix.ts  # グリッド生成
│       ├── combos.ts       # コンボ生成・フラグ判定
│       ├── calculations.ts # 集計計算
│       └── suitColors.ts   # スート色分け
├── index.html
├── vite.config.ts          # base設定重要
├── tsconfig.json
├── package.json
├── CLAUDE.md               # このファイル（安定ルール）
├── SPEC.md                 # 仕様詳細
└── README.md               # プロジェクト概要
```

---

## 関連ドキュメント

- **SPEC.md**: 仕様詳細（UI・操作・データモデル・集計など）
- **README.md**: プロジェクト概要・セットアップ方法
