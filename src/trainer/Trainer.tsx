import { useEffect, useState } from "react";
import { referenceRanges } from "../data/referenceRanges";
import { ReferenceOutline } from "../components/ReferenceOutline";
import { SUIT_SYMBOLS } from "../utils/combos";
import { ACTIONS, HANDS, STORAGE_KEY, correctActions, drawQuestion, restoreSettings } from "./model";
import type { Action, Settings } from "./model";
import { useFeedbackSound } from "./useFeedbackSound";
import { ScenarioTable } from "./ScenarioTable";
import "./trainer.css";
function initialSettings() {
  try { return restoreSettings(localStorage.getItem(STORAGE_KEY), referenceRanges); }
  catch { return restoreSettings(null, referenceRanges); }
}
export default function Trainer() {
  const feedback = useFeedbackSound();
  const [settings, setSettings] = useState(initialSettings);
  const [question, setQuestion] = useState(() => drawQuestion(settings, referenceRanges));
  const [answer, setAnswer] = useState<Action | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const correct = question ? correctActions(question.range, question.hand) : [];
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...settings })); setSaveError(false); }
    catch { setSaveError(true); }
  }, [settings]);
  function submit(action: Action) {
    if (!question || answer) return;
    setAnswer(action);
    feedback.play(correct.includes(action));
  }
  function update(next: Settings) {
    feedback.stop();
    setSettings(next);
    // 設定変更が即座に反映されるよう、回答結果も含めて新しい問題へ切り替える。
    setQuestion(drawQuestion(next, referenceRanges)); setAnswer(null);
  }
  function next() { feedback.stop(); setQuestion(drawQuestion(settings, referenceRanges)); setAnswer(null); }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || target.closest('input, select, textarea, [contenteditable="true"], .trainer-settings')) return;
      const action = ({ "1": "Fold", "2": "Call", "3": "Raise" } as Record<string, Action>)[event.key];
      if (action && question) { event.preventDefault(); submit(action); }
      if (event.code === "Space") { event.preventDefault(); if (answer) next(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, answer, settings, feedback.sound]);
  function toggleHand(hand: string) { update({ ...settings, hands: settings.hands.includes(hand) ? settings.hands.filter(h => h !== hand) : [...settings.hands, hand] }); }
  return <div className="trainer">
    <header className="trainer-header"><div><p className="trainer-eyebrow">PREFLOP PRACTICE</p><h1>Preflop Trainer</h1></div><a href="#/">Range Painter →</a></header>
    <main className="trainer-layout">
      <section className="trainer-practice" aria-label="プリフロップ問題">
        {question ? <>
          <div className="trainer-question"><p className="trainer-eyebrow">YOUR DECISION</p><h2>{question.range.name}</h2>
            {question.range.scenario && <ScenarioTable scenario={question.range.scenario} />}
            <div className="trainer-cards">{[question.combo.slice(0, 2), question.combo.slice(2)].map((card, i) => <div key={i} className={"trainer-card suit-" + card[1]} aria-label={card[0] + SUIT_SYMBOLS[card[1]]}><span>{card[0]}</span><span>{SUIT_SYMBOLS[card[1]]}</span></div>)}</div>
            <div className="trainer-actions">{ACTIONS.map((action, i) => <button key={action} disabled={!!answer} className={(answer === action ? "chosen " : "") + (answer && correct.includes(action) ? "correct" : "")} onClick={() => submit(action)}>{action}<kbd>{i + 1}</kbd></button>)}</div>
          </div>
        </> : <div className="trainer-empty"><h2>出題範囲を選択してください</h2><p>ハンドとレンジをそれぞれ1つ以上選ぶと、すぐに問題が表示されます。</p></div>}
      </section>
      <section className="trainer-feedback" aria-label="答え合わせ">
        <div className="trainer-result" aria-live="polite">{question && answer && <><div><strong className={correct.includes(answer) ? "trainer-success" : "trainer-error"}>{correct.includes(answer) ? "正解" : "不正解"}</strong><p>正解：{correct.join(" / ")} <span>· {question.hand}</span></p></div><button className="trainer-next" onClick={next}>次へ <kbd>Space</kbd></button></>}</div>
        <div className="trainer-review" aria-label="レンジ表"><div className="trainer-matrix">{HANDS.map(hand => <div key={hand} className={"trainer-cell " + (hand.length === 2 ? "pair " : "") + (answer && hand === question?.hand ? "current" : "")} aria-label={question && answer ? hand + ": " + correctActions(question.range, hand).join(" / ") + (hand === question.hand ? "（出題ハンド）" : "") : hand}>{hand}<ReferenceOutline call={!!answer && !!question?.range.groups.call?.includes(hand)} raise={!!answer && !!question?.range.groups.raise?.includes(hand)} /></div>)}</div></div>
      </section>
      <details className="trainer-settings" open={settingsOpen} onToggle={event => setSettingsOpen(event.currentTarget.open)}><summary>出題設定 <span>{settings.hands.length} ハンド · {settings.rangeIds.length} レンジ</span></summary>
        <p className="trainer-note">いつでも変更できます。変更すると新しい問題に切り替わります。</p>
        <div className="trainer-sound-controls"><label><input type="checkbox" checked={feedback.sound.enabled} onChange={event => feedback.setSound({ ...feedback.sound, enabled: event.target.checked })} />効果音</label><label>音量 <input type="range" min="0" max="100" step="5" value={Math.round(feedback.sound.volume * 100)} onChange={event => feedback.setSound({ ...feedback.sound, volume: Number(event.target.value) / 100 })} /><span>{Math.round(feedback.sound.volume * 100)}%</span></label><button onClick={() => feedback.play(true)}>正解音</button><button onClick={() => feedback.play(false)}>不正解音</button></div>
        {feedback.saveError && <p className="trainer-note">音の設定を保存できません。この画面ではそのまま利用できます。</p>}
        <div className="trainer-settings-columns"><div>
        <div className="trainer-section-title"><h3>ハンド</h3><div><button onClick={() => update({ ...settings, hands: [...HANDS] })}>全選択</button><button onClick={() => update({ ...settings, hands: [] })}>解除</button></div></div>
        <div className="trainer-presets">{[["ペア", ""], ["Suited", "s"], ["Offsuit", "o"]].map(([label, suffix]) => <button key={label} onClick={() => update({ ...settings, hands: HANDS.filter(h => suffix ? h.endsWith(suffix) : h.length === 2) })}>{label}のみ</button>)}</div>
        <div className="trainer-matrix" aria-label="出題ハンド選択">{HANDS.map(hand => <button key={hand} className={"trainer-cell " + (settings.hands.includes(hand) ? "selected" : "")} aria-pressed={settings.hands.includes(hand)} onClick={() => toggleHand(hand)}>{hand}</button>)}</div>
        </div><div>
        <div className="trainer-section-title"><h3>レンジ</h3><div><button onClick={() => update({ ...settings, rangeIds: referenceRanges.map(r => r.id) })}>全選択</button><button onClick={() => update({ ...settings, rangeIds: [] })}>解除</button></div></div>
        <div className="trainer-range-list">{referenceRanges.map(range => <label key={range.id}><input type="checkbox" checked={settings.rangeIds.includes(range.id)} onChange={event => update({ ...settings, rangeIds: event.target.checked ? [...settings.rangeIds, range.id] : settings.rangeIds.filter(id => id !== range.id) })} />{range.name}</label>)}</div>
        </div></div>
        <p className="trainer-note">{saveError ? "設定を保存できません。この画面ではそのまま練習できます。" : "出題設定はこのブラウザに自動保存されます。成績は記録しません。"}</p>
      </details>
      {feedback.error && <p className="trainer-note" role="status">{feedback.error}</p>}
    </main>
  </div>;
}
