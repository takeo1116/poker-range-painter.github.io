const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const load = require("../scripts/load-typescript.cjs");
const root = path.resolve(__dirname, "..");
const { parseReferenceRange, validateReferenceCollection } = load(path.join(root, "src/utils/referenceRanges.ts"));
const { paintReferenceRange, selectedKeys, editorHistory } = load(path.join(root, "src/dev/referenceEditorModel.ts"));
const blank = () => ({ id: "sample", name: "Sample", groups: { call: [], raise: [] } });
const plain = value => JSON.parse(JSON.stringify(value));

test("Call/Raiseの重複を保ち、JSON出力を再読込できる", () => {
  const data = { ...blank(), groups: { call: ["AQs"], raise: ["AA", "AQs"] } };
  assert.deepEqual(plain(parseReferenceRange(JSON.parse(JSON.stringify(data)))), data);
});

test("不正なハンド・型・グループ・同一グループ内重複を拒否する", () => {
  for (const key of ["KAo", "AAs", "A1s", "AK", "", "AKss"]) {
    assert.throws(() => parseReferenceRange({ ...blank(), groups: { call: [key] } }));
  }
  for (const groups of [{ fold: ["AA"] }, { call: "AA" }, { raise: ["AA", "AA"] }, {}, null]) {
    assert.throws(() => parseReferenceRange({ ...blank(), groups }));
  }
  assert.throws(() => parseReferenceRange({ ...blank(), id: "../bad" }));
  assert.throws(() => parseReferenceRange({ ...blank(), name: " " }));
  assert.throws(() => parseReferenceRange({ ...blank(), typo: true }));
});

test("ID重複とファイル名の不一致を拒否する", () => {
  assert.throws(() => validateReferenceCollection({ "a/sample.json": blank(), "b/sample.json": blank() }), /id/);
  assert.throws(() => validateReferenceCollection({ "different.json": blank() }), /sample.json/);
});

test("未完成のメタデータは下書きだけに許可し、ハンドの検証は省略しない", () => {
  const draft = { ...blank(), id: "", name: "" };
  assert.equal(parseReferenceRange(draft, "draft", true).id, "");
  assert.throws(() => parseReferenceRange(draft));
  assert.throws(() => parseReferenceRange({ ...draft, groups: { call: ["bad"] } }, "draft", true));
});

test("重ね塗り・片側消去・両方消去は独立し、元データを変更しない", () => {
  const original = blank();
  const call = paintReferenceRange(original, ["AQs", "JJ"], "call", "add");
  const both = paintReferenceRange(call, ["AQs", "AA"], "raise", "add");
  const removed = paintReferenceRange(both, ["AQs"], "raise", "remove");
  assert.ok(removed.groups.call.includes("AQs"));
  assert.ok(!removed.groups.raise.includes("AQs"));
  const cleared = paintReferenceRange(both, ["AQs"], "call", "clear");
  assert.ok(!cleared.groups.call.includes("AQs"));
  assert.ok(!cleared.groups.raise.includes("AQs"));
  assert.deepEqual(original, blank());
  assert.ok(both.groups.raise.includes("AQs"));
});

test("逆方向の矩形と高速ドラッグの補完", () => {
  assert.equal(selectedKeys([3, 3], [1, 1], true).length, 9);
  const line = selectedKeys([0, 0], [0, 12], false);
  assert.equal(line.length, 13);
  assert.equal(line[0], "AA");
  assert.equal(line[12], "A2s");
});

test("読込・新規作成もUndo/Redoでき、新規操作後はRedoを破棄", () => {
  const initial = { past: [], present: blank(), future: [] };
  const painted = paintReferenceRange(initial.present, ["AA"], "raise", "add");
  const changed = editorHistory(initial, { type: "change", document: painted });
  const undone = editorHistory(changed, { type: "undo" });
  assert.deepEqual(plain(undone.present), blank());
  assert.deepEqual(plain(editorHistory(undone, { type: "redo" }).present), plain(painted));
  const replacement = { ...blank(), id: "other" };
  const replaced = editorHistory(undone, { type: "change", document: replacement });
  assert.equal(replaced.future.length, 0);
  assert.equal(editorHistory(replaced, { type: "undo" }).present.id, "sample");
});

test("登録済みJSONをまとめて検証できる", () => {
  const directory = path.join(root, "src/data/reference-ranges");
  const files = Object.fromEntries(fs.readdirSync(directory).filter(file => file.endsWith(".json"))
    .map(file => [file, JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"))]));
  assert.equal(validateReferenceCollection(files).length, Object.keys(files).length);
});
