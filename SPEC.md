# SPEC.md - 仕様詳細

このドキュメントは現行実装と完全に一致する仕様書です。

---

## UI構成

### タイトル
- "Range Painter"

### レイアウト構造
```
┌─────────────────────────────────────┐
│         Range Painter               │
├─────────────────────────────────────┤
│  [Pre] [Flop] [Turn] [River]        │  ← ストリートタブ
├─────────────────────────────────────┤
│  ボード: [?] [?] [?]                 │  ← ボード入力（Flop以降）
│         [前ストリートからコピー]       │
├─────────────────────────────────────┤
│  [前ストリートをコピー]               │
│  ┌─────────────┐  ┌─────────────┐  │
│  │   Hero      │  │  Villain    │  │  ← レンジグリッド（13×13）
│  │  13×13グリッド│  │13×13グリッド│  │
│  │             │  │             │  │
│  └─────────────┘  └─────────────┘  │
│                   [前ストリートをコピー]│
├─────────────────────────────────────┤
│  Hero集計         Villain集計        │  ← 集計パネル
│  Value: XX        Value: XX         │
│  Bluff: XX        Bluff: XX         │
│  Total: XX        Total: XX         │
│  Bluff:Value: X   Bluff:Value: X    │
│  Bluff%: XX%      Bluff%: XX%       │
├─────────────────────────────────────┤
│  操作パネル                          │
│  Paint: [Value] [Bluff] [Exclude]   │
│  Flag: [OFF] [ONLY] [EXCEPT]        │
│  フラグパレット（18種、4行配置）      │
│  [Undo] [Redo]                      │
└─────────────────────────────────────┘
```

### コンポーネント詳細

#### ストリートタブ
- Pre / Flop / Turn / River の4タブ
- 選択中のタブはハイライト表示

#### ボード入力
- ストリートタブの下、レンジグリッドの上に配置
- **全ストリートで表示**（レイアウトの安定化）
- **常に5枠表示**：
  - Pre: 全5枠が×印で無効
  - Flop: 1-3枠目が有効、4-5枠目は×印で無効
  - Turn: 1-4枠目が有効、5枠目は×印で無効
  - River: 全5枠が有効
  - 3-4枠目の間と4-5枠目の間のスペースが他より広い
- 各枠をクリックするとカード選択モーダルが表示
  - 52枚のカードボタン（スート×ランク）
  - スートごとに行分け、色分け表示
  - すでに使用中のカードは選択不可（disabled）
  - 無効な枠（×印）はクリック不可
- **カード表示**：
  - 入力済みの枠はカード選択ボタンと同じデザイン（色付き四角にランク）
  - スート色：♠黒、♥赤、♦青、♣緑
- **ボタン配置**（ボードの下）：
  - 左側：「前ストリートをコピー」（常に表示）
  - 右側：「クリア」（常に表示）
  - **ボタンは常に表示され、使用不可時はdisabled状態**
    - Pre: 両方のボタンがdisabled
    - Flop: 「前ストリートをコピー」がdisabled、「クリア」は有効
    - Turn/River: 両方のボタンが有効
  - disabled状態のスタイル：
    - 背景色：#1a1a1a（濃い黒）
    - ボーダー色：#2a2a2a（暗灰色）
    - 文字色：#333（目立たない灰色）
  - レイアウトの安定化：全ストリートで同じボタン配置

#### レンジグリッド
- Hero/Villainそれぞれ13×13のグリッド
- **ヘッダー**（グリッドの上）:
  - プレイヤー名「Hero」または「Villain」を中央に表示
  - **参照レンジ選択UI**（プレイヤー名の下）:
    - ラベル「参照レンジ:」とドロップダウン選択
    - 選択肢先頭に「なし」（ハイライト解除）
    - 静的プリセット定義（`src/data/referenceRanges.ts`）から読み込んだレンジ名を表示
    - Hero/Villain独立で1つずつ選択可能
- **グリッド**: 13×13のセル配置
  - 参照レンジ選択時、該当セルに枠表示（オレンジ色の枠線）
- **フッター**（グリッドの下、2カラムレイアウト）:
  - **Hero**:
    - 左: 「前ストリートをコピー」ボタン（常に表示、Preではdisabled）
    - 右: 「クリア」ボタン（グリッドの右端に合わせて配置）
  - **Villain**:
    - 左: 「クリア」ボタン（グリッドの左端に合わせて配置）
    - 右: 「前ストリートをコピー」ボタン（常に表示、Preではdisabled）
- **コピーボタン**: Preストリートではdisabled状態
  - disabled状態のスタイル：
    - 背景色：#1a1a1a（濃い黒）
    - ボーダー色：#2a2a2a（暗灰色）
    - 文字色：#333（目立たない灰色）
- **クリアボタン**:
  - クリック時の動作：そのプレイヤーの現在のストリートのレンジ表を全てExcludeに戻す
  - Undo/Redo対応：クリア操作も1手として履歴に保存
  - 赤色スタイル（border: #f44336）

#### 操作パネル
- **Paintモード**: Value / Bluff / Exclude の3択（排他選択）
- **Flagモード**: OFF / ONLY / EXCEPT の3択（排他選択）
- **フラグパレット**: Flagモード≠OFFのときのみ表示
- **Undo/Redo**: キーボードショートカット付きボタン

#### 集計パネル
- Hero/Villainそれぞれ独立した集計表示
- 現在のストリートのみの集計

---

## レンジ表仕様

### グリッド構造（13×13）

#### ランク順
```
A K Q J T 9 8 7 6 5 4 3 2
```

#### セル配置ルール
- **対角線**（row == col）: ポケットペア（AA, KK, ..., 22）
- **対角線上**（row < col）: suited（AKs, AQs, ..., 32s）
- **対角線下**（row > col）: offsuit（AKo, AQo, ..., 32o）

#### セルキー形式
- ペア: `"AA"`, `"KK"`, ..., `"22"`（2文字）
- suited: `"AKs"`, `"AQs"`, ..., `"32s"`（3文字、最後が's'）
- offsuit: `"AKo"`, `"AQo"`, ..., `"32o"`（3文字、最後が'o'）
  - **重要**: offsuitは常に大きい方のランクが先（例: `"AKo"`、`"KAo"`ではない）

---

## フラグ仕様

### フラグ定義（18種類）

#### 1. suited（4種）
- `♠♠` (id: "ss")
- `♥♥` (id: "hh")
- `♦♦` (id: "dd")
- `♣♣` (id: "cc")

#### 2. upper（4種）- 高ランク側スート指定
- `♠X` (id: "sX")
- `♥X` (id: "hX")
- `♦X` (id: "dX")
- `♣X` (id: "cX")

#### 3. lower（4種）- 低ランク側スート指定
- `X♠` (id: "Xs")
- `X♥` (id: "Xh")
- `X♦` (id: "Xd")
- `X♣` (id: "Xc")

#### 4. twosuit（6種）- 2スート組
- `♠♥` (id: "sh")
- `♠♦` (id: "sd")
- `♠♣` (id: "sc")
- `♥♦` (id: "hd")
- `♥♣` (id: "hc")
- `♦♣` (id: "dc")

### フラグパレット表示順序
- **1行目**: ♠♠ ♥♥ ♦♦ ♣♣
- **2行目**: ♠X ♥X ♦X ♣X
- **3行目**: X♠ X♥ X♦ X♣
- **4行目**: ♠♥ ♠♦ ♠♣ ♥♦ ♥♣ ♦♣

### スート色分け
フラグパレットとセル上のオーバーライド表示の両方に適用：

- **♠**: 黒（#000）、EXCEPTモードのときは白（#fff）
- **♥**: 赤（#e53935）
- **♦**: 青（#1e88e5）
- **♣**: 緑（#43a047）
- **X**: 灰色（#888）

---

## セル状態

### データ構造
```typescript
type BaseState = "excluded" | "value" | "bluff";

type Override =
  | null
  | { flagId: string; mode: "only"; state: "value" | "bluff" }
  | { flagId: string; mode: "except" };

type CellState = {
  baseState: BaseState;
  override: Override;
};
```

### 7種類の状態パターン

#### overrideなし（3種）
1. **Exclude**: `{baseState: "excluded", override: null}`
2. **Value**: `{baseState: "value", override: null}`
3. **Bluff**: `{baseState: "bluff", override: null}`

#### overrideあり（4種）
4. **Value+Only**: `{baseState: "value", override: {flagId, mode: "only", state: "value"}}`
5. **Bluff+Only**: `{baseState: "bluff", override: {flagId, mode: "only", state: "bluff"}}`
6. **Value+Except**: `{baseState: "value", override: {flagId, mode: "except"}}`
7. **Bluff+Except**: `{baseState: "bluff", override: {flagId, mode: "except"}}`

**重要**: overrideを持つセルは必ずbaseStateもvalue/bluffになる（excludedにはならない）

### セル表示
- **背景色**: baseStateに応じて色分け
  - excluded: 暗灰色（#2a2a2a）
  - value: 青（#2196F3）
  - bluff: 赤（#f44336）
- **オーバーライド表示**: セル右上に色付きフラグ
  - ONLYモード: ほぼ不透明な白背景（rgba(255, 255, 255, 0.85)）
  - EXCEPTモード: 半透明黒背景（rgba(0, 0, 0, 0.7)）

---

## 操作仕様

### ドラッグ塗り
- マウスダウン時: ドラッグ開始、セルを記録
- マウスムーブ時: 通過したセルを追加記録
- マウスアップ時: 記録したセル全てに操作を適用、履歴に1手として保存

### Flagモード別の挙動

#### OFF（ベース塗り）
- **同じbaseStateを上書き**: Excludeに変更（トグル動作）
- **異なるbaseState**: 指定したPaintモードに変更
- **override**: 常にnullに設定（解除）

例:
- Value状態のセルにValue塗り → Excludeに変更
- Value状態のセルにBluff塗り → Bluffに変更
- Exclude状態のセルにValue塗り → Valueに変更

#### ONLY（その条件だけ含む）
- **paintMode=exclude**: 無効（何もしない）
- **適用時**: baseStateをpaintModeに変更し、overrideを設定
- **トグル**: 同じflagId+mode+stateの場合、Excludeに戻る

例:
- Exclude状態のセルに「ONLY+♥♥+Value」適用 → `{baseState: "value", override: {flagId: "hh", mode: "only", state: "value"}}`
- 上記状態のセルに再度「ONLY+♥♥+Value」適用 → `{baseState: "excluded", override: null}`

#### EXCEPT（その条件だけ除外）
- **paintMode=exclude**: 無効（何もしない）
- **適用時**: baseStateをpaintModeに変更し、overrideを設定
- **トグル**: 同じflagId+modeの場合、Excludeに戻る

例:
- Exclude状態のセルに「EXCEPT+♠♠+Value」適用 → `{baseState: "value", override: {flagId: "ss", mode: "except"}}`
- 上記状態のセルに再度「EXCEPT+♠♠」適用 → `{baseState: "excluded", override: null}`

### 前ストリートコピー

#### レンジのコピー
- **利用可能**: Flop/Turn/Riverストリート
- **動作**: 1つ前のストリートの全セル状態をコピー
- **Undo対応**: コピー操作も1手としてUndo/Redo可能

#### ボードのコピー
- **利用可能**: Turn/Riverストリート（Flopは非表示）
- **動作**: 1つ前のストリートのボード状態（5枠分）をそのままコピー
- 例: Flopで1-3枠に入力済み → Turnでコピーすると1-3枠に同じカード、4-5枠は空

---

## Undo/Redo

### キーボードショートカット
- **Undo**: Ctrl+Z（Windows/Linux）、Cmd+Z（Mac）
- **Redo**: Ctrl+Y（Windows/Linux）、Cmd+Shift+Z（Mac）

### 履歴管理
- **1手の単位**: ドラッグ1回、またはコピー1回
- **履歴形式**: 差分（patch）で保存
  ```typescript
  type CellPatch = {
    cellKey: string;
    before: CellState;
    after: CellState;
  };

  type HistoryEntry = {
    street: Street;
    player: Player;
    patches: CellPatch[];
  };
  ```
- **履歴の巻き戻し/やり直し**: patchのbefore/afterを適用

---

## コンボ生成とフラグ判定

### コンボ数
- **ペア**: 6コンボ（例: AA = AsAh, AsAd, AsAc, AhAd, AhAc, AdAc）
- **suited**: 4コンボ（例: AKs = AsKs, AhKh, AdKd, AcKc）
- **offsuit**: 12コンボ（例: AKo = AsKh, AsKd, AsKc, AhKs, ...）

### コンボID形式
- 4文字: `"AsKh"`, `"AhKd"` など
- ランク+スート+ランク+スート

### フラグ判定ロジック

#### 高ランク/低ランク判定
- ランク順（A=0, K=1, ..., 2=12）のインデックスで比較
- インデックスが小さい方が高ランク
- ペアの場合は最初のカードが高ランク扱い

#### フラグ別判定
- **suited（♠♠等）**: 両カードが同一スート かつ 指定スート
- **upper（♠X等）**: 高ランク側のスートが指定スート
- **lower（X♠等）**: 低ランク側のスートが指定スート
- **twosuit（♠♥等）**: 2枚のスート集合が指定の2スート（順不同）

### override適用ロジック
各コンボの最終状態を以下のルールで決定：

1. **overrideなし**: baseStateをそのまま使用
2. **ONLYモード**:
   - フラグ一致 → override.state（value/bluff）
   - フラグ不一致 → excluded
3. **EXCEPTモード**:
   - フラグ一致 → excluded
   - フラグ不一致 → baseState

---

## 集計

### ボード除外ロジック
- **入力されたボードカードと重複するコンボは集計から除外**
- 判定方法: コンボID（例: "AsKh"）の2枚のカードがボードに含まれているか
- 例: ボードに"As"が入力されている場合
  - "AsKh", "AsKd", "AsKc", "AsQh", ... など"As"を含む全コンボが除外
  - "KhQh", "AdKd"など"As"を含まないコンボは集計対象

### 集計項目
- **valueCount**: 最終状態がvalueのコンボ数（ボード除外後）
- **bluffCount**: 最終状態がbluffのコンボ数（ボード除外後）
- **includedTotal**: valueCount + bluffCount
- **bluffToValueRatio**: bluffCount / valueCount
  - valueCount = 0 かつ bluffCount > 0 → `"∞"`
  - valueCount = 0 かつ bluffCount = 0 → `"N/A"`
  - それ以外 → 小数点2桁（例: `"2.50"`）
- **bluffPercent**: (bluffCount / includedTotal) × 100
  - includedTotal = 0 → `"N/A"`
  - それ以外 → 小数点1桁+"%"（例: `"75.0%"`）

### 集計スコープ
- 現在のストリートのみ
- Hero/Villain独立
- **ボード変更時にリアルタイム再計算**

---

## データモデル

### 全体構造
```typescript
type Street = "pre" | "flop" | "turn" | "river";
type Player = "hero" | "villain";

type RangeState = Record<
  Street,
  Record<Player, Record<string /* cellKey */, CellState>>
>;

type CardId = string; // 例: "As", "Kh"

type BoardState = Record<Street, CardId[]>;

type ReferenceRangeSelection = Record<Player, string | null>; // rangeId or null
```

### 初期状態

#### レンジ
- 全セル: `{baseState: "excluded", override: null}`
- 全ストリート・全プレイヤーで同じ初期状態

#### ボード
```typescript
{
  pre: ["", "", "", "", ""],
  flop: ["", "", "", "", ""],
  turn: ["", "", "", "", ""],
  river: ["", "", "", "", ""]
}
```
- 常に5要素の配列
- 空文字列は未入力を表す
- ストリートごとに有効な枠数が異なる（Flop: 3, Turn: 4, River: 5）

#### 参照レンジ選択
```typescript
{
  hero: null,
  villain: null
}
```
- 初期状態は両プレイヤーとも`null`（なし選択）
- 選択時は参照レンジの`id`文字列を保持

---

## 参照レンジ（プリセットレンジ）

### 概要
- 特定シチュエーション（例: BTNオープン）の参照用レンジを表示する機能
- 既存の塗り分け（Value/Bluff/Exclude）とは独立して、セル集合を「参照用の枠表示」として重ねて表示

### プリセット定義
- **保存場所**: `src/data/referenceRanges.ts`（TypeScript静的定義）
- **定義形式**:
  ```typescript
  type ReferenceRange = {
    id: string;       // 英数字+ハイフン（例: "btn-open"）
    label: string;    // 表示用文字列（日本語可、例: "BTN Open"）
    cells: string[];  // セルキー配列（例: ["AA", "AKs", "AKo"]）
  };
  ```
- **バリデーション**:
  - `id`形式チェック（英数字とハイフンのみ）
  - セルキー妥当性チェック（AA, AKs, AKo形式）
  - 不正なキーは無視し、`console.warn`を出力
- **デプロイ**: GitHub Pages配信物に同梱され、デプロイ時点の内容が読み込まれる

### UI操作
- **選択UI**: 各レンジグリッドヘッダーにドロップダウン選択を配置
- **選択肢**:
  - 先頭: 「なし」（ハイライト解除）
  - 以降: プリセット定義ファイルの記述順でレンジ名を表示
- **選択状態**:
  - Hero/Villainは独立して1つずつ選択可能
  - 別レンジへ切替時、前の枠表示は消え、新しい枠表示に置き換わる
  - 「なし」を選択すると枠表示が消える

### 枠表示
- **表示方法**: 選択中の参照レンジに含まれるセルを枠線でハイライト
- **スタイル**: オレンジ色の枠線（`box-shadow: inset 0 0 0 3px #FF9800; border: 3px solid #FF9800;`）
- **判定**: セルキーが選択中参照レンジ集合に含まれるかのみで判定、baseState/overrideとは独立
- **集計への影響**: 枠表示は集計値（Value/Bluff/Total/比率）に一切影響しない

### 既存機能との独立性
- ストリート切替、Paint操作、Flag操作、Undo/Redoは既存挙動を維持
- 参照レンジ選択は塗り状態や履歴管理に影響を与えない
- 枠表示中にセル塗りやストリート切替を行っても、既存機能と集計は正しく動作

### ランタイム編集
- ランタイムでのプリセット登録・編集・削除UIは実装しない
- プリセットの追加・変更はリポジトリの静的定義ファイルを編集してデプロイ

---

## TODO（実装と仕様のズレ・不明点）

現時点では実装とこのSPEC.mdは完全に一致しています。
今後の変更はこのSPEC.mdを更新してから実装に反映してください。
