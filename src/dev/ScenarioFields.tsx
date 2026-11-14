import type { ReferenceRange } from "../utils/referenceRanges";
import { POSITIONS } from "../utils/rangeScenario";
import type { Position } from "../utils/rangeScenario";
export function ScenarioFields({ document, onChange }: { document: ReferenceRange; onChange: (next: ReferenceRange) => void }) {
  const scenario = document.scenario;
  return <section><h2>状況図（任意）</h2>
    <label><input type="checkbox" checked={!!scenario} onChange={event => {
      const { scenario: _scenario, ...rest } = document;
      onChange(event.target.checked ? { ...rest, scenario: { tableSize: 6, hero: "BTN" } } : rest);
    }} />6maxのプリフロップ状況を登録</label>
    {scenario && <>
      <label>自分の位置<select value={scenario.hero} onChange={event => {
        const hero = event.target.value as Position;
        const opener = scenario.opener && POSITIONS.indexOf(scenario.opener) < POSITIONS.indexOf(hero) ? scenario.opener : hero === "BB" ? "SB" : undefined;
        const { opener: _opener, openSizeBb: _size, ...rest } = scenario;
        onChange({ ...document, scenario: { ...rest, hero, ...(opener ? { opener } : {}) } });
      }}>{POSITIONS.map(p => <option key={p}>{p}</option>)}</select></label>
      <label>先にOpenした位置<select value={scenario.opener ?? ""} onChange={event => {
        const { opener: _opener, openSizeBb: _size, ...rest } = scenario;
        onChange({ ...document, scenario: { ...rest, ...(event.target.value ? { opener: event.target.value as Position } : {}) } });
      }}>{scenario.hero !== "BB" && <option value="">未オープン</option>}{POSITIONS.slice(0, POSITIONS.indexOf(scenario.hero)).map(p => <option key={p}>{p}</option>)}</select></label>
      <label>開始スタック（bb）<input type="number" min="2" step="any" value={scenario.stackBb ?? ""} onChange={event => onChange({ ...document, scenario: { ...scenario, stackBb: event.target.value === "" ? undefined : Number(event.target.value) } })} /></label>
      <label>ステークス<input placeholder="NL50" value={scenario.stakes ?? ""} onChange={event => onChange({ ...document, scenario: { ...scenario, stakes: event.target.value || undefined } })} /></label>
      <label>Openサイズ（bb・任意）<input type="number" min="1.01" step="any" placeholder="未登録" value={scenario.openSizeBb ?? ""} onChange={event => onChange({ ...document, scenario: { ...scenario, openSizeBb: event.target.value === "" ? undefined : Number(event.target.value) } })} /></label>
      <p className="editor-tip">未オープン、または単独Openへの対応用です。位置を変更するとOpenサイズをリセットします。空欄の条件は表示しません。</p>
    </>}
  </section>;
}
