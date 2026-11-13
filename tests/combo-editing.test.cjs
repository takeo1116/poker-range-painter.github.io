const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function setup(editing) {
  const slots = [];
  const calls = [];
  let cursor = 0;
  const jsx = (type, props) => ({ type, props });
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value) => { slots[index] = value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect() {},
  };
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { exports, require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      const base = path.resolve(path.dirname(file), name);
      return load(fs.existsSync(base + ".ts") ? base + ".ts" : base + ".tsx");
    } });
    return exports;
  }
  const root = path.resolve(__dirname, "../src");
  const { RangeGrid } = load(path.join(root, "components/RangeGrid.tsx"));
  const { ComboInspector } = load(path.join(root, "components/ComboInspector.tsx"));
  const { Cell } = load(path.join(root, "components/Cell.tsx"));
  const { generateCellKeys } = load(path.join(root, "utils/rangeMatrix.ts"));
  const cells = Object.fromEntries(generateCellKeys().map(key => [key, { combos: {} }]));
  const props = {
    comboEditing: editing, player: "hero", selectionMode: "brush",
    paintState: null, detailPaint: "value", currentStreet: "pre",
    cells, board: [], referenceRanges: [], selectedReferenceRangeId: null,
    onDragPaint: (...args) => calls.push(args),
  };
  const flatten = node => !node ? [] : Array.isArray(node)
    ? node.flatMap(flatten) : [node, ...flatten(node.props?.children)];
  const render = () => {
    cursor = 0;
    const nodes = flatten(RangeGrid(props));
    return {
      cell: key => nodes.find(node => node.type === Cell && node.props.cellKey === key),
      panel: nodes.find(node => node.type === ComboInspector),
      grid: nodes.find(node => node.props?.className === "range-grid"),
    };
  };
  return { render, calls, props, ComboInspector, Cell, flatten };
}

test("編集対象はホバー・フォーカスで変わらず、選択クリックは塗らない", () => {
  const h = setup(true);
  let view = h.render();
  view.cell("QQ").props.onSelect();
  view = h.render();
  assert.equal(view.panel.props.cellKey, "QQ");
  view.cell("22").props.onInspect();
  view = h.render();
  assert.equal(view.panel.props.cellKey, "QQ");
  view.grid.props.onPointerDown({ button: 0, isPrimary: true });
  view.grid.props.onPointerDown({ button: 2, isPrimary: true });
  assert.equal(h.calls.length, 0);
  view.panel.props.onPaintCombo("QsQh", false);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0][0][0], "QQ");
  assert.equal(h.calls[0][1].comboId, "QsQh");
  view.cell("AA").props.onSelect();
  assert.equal(h.render().panel.props.cellKey, "AA");
});

test("塗るモードはホバー追従し、内訳パネルからは編集できない", () => {
  const h = setup(false);
  let view = h.render();
  view.cell("QQ").props.onInspect();
  view = h.render();
  assert.equal(view.panel.props.cellKey, "QQ");
  view.panel.props.onPaintCombo("QsQh", false);
  assert.equal(h.calls.length, 0);
  const buttons = h.flatten(h.ComboInspector(view.panel.props)).filter(node => node.type === "button");
  assert.equal(buttons.length, 6);
  assert.ok(buttons.every(button => button.props.disabled));
});

test("Enterで対象を選択でき、編集モードではボード使用不可コンボを編集できない", () => {
  const h = setup(true);
  let view = h.render();
  const cell = h.Cell(view.cell("QQ").props);
  let prevented = false;
  cell.props.onKeyDown({ key: "Enter", preventDefault() { prevented = true; } });
  assert.ok(prevented);
  view = h.render();
  assert.equal(view.panel.props.cellKey, "QQ");
  const buttons = h.flatten(h.ComboInspector({ ...view.panel.props, board: ["Qs"] }))
    .filter(node => node.type === "button");
  assert.equal(buttons.filter(button => button.props.disabled).length, 3);
  const blocked = buttons.find(button => button.props.disabled);
  blocked.props.onClick();
  blocked.props.onContextMenu({ preventDefault() {} });
  assert.equal(h.calls.length, 0);
});
