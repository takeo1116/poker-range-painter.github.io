const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const vm = require("node:vm");

// 本番と同じES2020設定で純粋関数を読み込み、テスト用の依存パッケージを増やさない。
const cache = new Map();
function load(relative) {
  const file = path.resolve(__dirname, "..", relative);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require: (name) => load(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(file), name + ".ts"))),
  });
  return exports;
}
const { applyPaint, getPaintState } = load("src/utils/painting.ts");
const { getComboDetails, calculateCellCombos, calculateStats } = load("src/utils/calculations.ts");
const { generateCellKeys } = load("src/utils/rangeMatrix.ts");
const { generateCombosForCell, comboMatchesFlag, FLAG_DEFINITIONS } = load("src/utils/combos.ts");
const operation = (state, mode = "off", flagId = null) => ({ state, mode, flagId });
const empty = () => ({ combos: {} });
function mixed() {
  const value = applyPaint("AKs", empty(), operation("value", "only", "ss"));
  return applyPaint("AKs", value, operation("bluff", "only", "hh"));
}

test("suitedでValueとBluffが共存し、同じ色の再適用は変更なし", () => {
  const result = mixed();
  assert.equal(result.combos.AsKs, "value");
  assert.equal(result.combos.AhKh, "bluff");
  assert.equal(getComboDetails("AKs", result)[2].state, "excluded");
  assert.equal(applyPaint("AKs", result, operation("bluff", "only", "hh")), result);
  const stats = calculateStats({ AKs: result });
  assert.equal(stats.valueCount, 1);
  assert.equal(stats.bluffCount, 1);
  assert.equal(stats.bluffPercent, "50.0%");
});

test("条件に一致する部分だけ消去し、右ドラッグ相当の全消去はすべて消す", () => {
  const result = mixed();
  const partial = applyPaint("AKs", result, operation("excluded", "only", "hh"));
  assert.equal(partial.combos.AsKs, "value");
  assert.equal(partial.combos.AhKh, undefined);
  assert.equal(Object.keys(applyPaint("AKs", result, operation("excluded")).combos).length, 0);
});

test("ボードで隠れた分類は保存され、ボードを外すと復元される", () => {
  const result = mixed();
  const board = ["As", "2h", "3s", "4h", "5s"];
  assert.equal(getComboDetails("AKs", result, board)[0].state, "blocked");
  assert.equal(calculateCellCombos("AKs", result, board).valueCombos, 0);
  assert.equal(calculateCellCombos("AKs", result, []).valueCombos, 1);
  assert.equal(result.combos.AsKs, "value");
});

test("履歴・前ストリートと共有したデータを書き換えず、before/afterを復元できる", () => {
  const before = mixed();
  Object.freeze(before.combos);
  Object.freeze(before);
  const copied = before;
  const after = applyPaint("AKs", copied, operation("bluff"));
  assert.equal(before.combos.AsKs, "value");
  assert.equal(after.combos.AsKs, "bluff");
  const patch = { before, after };
  let current = patch.after;
  current = patch.before;
  assert.equal(current.combos.AsKs, "value");
  current = patch.after;
  assert.equal(current.combos.AsKs, "bluff");
});

test("個別コンボ編集は他のコンボに影響せず、無効なIDは変更しない", () => {
  const before = mixed();
  const after = applyPaint("AKs", before, { ...operation("bluff"), comboId: "AdKd" });
  assert.equal(after.combos.AsKs, "value");
  assert.equal(after.combos.AhKh, "bluff");
  assert.equal(after.combos.AdKd, "bluff");
  assert.equal(applyPaint("AKs", before, { ...operation("value"), comboId: "AsAh" }), before);
});

test("全169セル・18条件で対象のみを上書きし、対象外を維持", () => {
  for (const key of generateCellKeys()) {
    const before = applyPaint(key, empty(), operation("value"));
    for (const flag of FLAG_DEFINITIONS) {
      for (const mode of ["only", "except"]) {
        const after = applyPaint(key, before, operation("bluff", mode, flag.id));
        for (const id of generateCombosForCell(key)) {
          const selected = comboMatchesFlag(id, flag.id) === (mode === "only");
          assert.equal(after.combos[id], selected ? "bluff" : "value");
          assert.equal(before.combos[id], "value");
        }
      }
    }
  }
});

test("条件未選択の塗りは無効。Excludeでも対象条件を保持", () => {
  assert.equal(getPaintState("value", "only", null), null);
  assert.equal(getPaintState("exclude", "except", null), null);
  const paint = getPaintState("exclude", "only", "ss");
  assert.equal(paint.state, "excluded");
  assert.equal(paint.mode, "only");
});
