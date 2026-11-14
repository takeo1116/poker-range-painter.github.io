import { useState, useReducer, useEffect, useRef, ChangeEvent } from "react";
import { referenceRanges } from "../data/referenceRanges";
import { parseReferenceRange, ReferenceRange, ReferenceGroup } from "../utils/referenceRanges";
import { editorHistory, EditorAction } from "./referenceEditorModel";
import { ReferenceEditorGrid } from "./ReferenceEditorGrid";
import "../App.css";
import "./reference-editor.css";

const DRAFT_KEY = "range-painter.reference-editor.draft.v1";
const blank = (): ReferenceRange => ({ id: "", name: "", groups: { call: [], raise: [] } });
function restoreDraft(): { document: ReferenceRange; message: string } {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { document: blank(), message: "新しいレンジを作成できます。" };
    const saved = JSON.parse(raw);
    if (saved.version !== 1) throw new Error("下書きの形式が対応外です");
    return { document: parseReferenceRange(saved.document, "下書き", true), message: "このブラウザの下書きを復元しました。" };
  } catch (error) {
    return { document: blank(), message: "下書きを復元できませんでした: " + String(error) };
  }
}

export default function ReferenceRangeEditor() {
  const [initial] = useState(restoreDraft);
  const [history, dispatch] = useReducer(editorHistory, { past: [], present: initial.document, future: [] });
  const document = history.present;
  const [group, setGroup] = useState<ReferenceGroup>("raise");
  const [action, setAction] = useState<EditorAction>("add");
  const [rectangle, setRectangle] = useState(false);
  const [presetId, setPresetId] = useState(referenceRanges[0]?.id || "");
  const [message, setMessage] = useState(initial.message);
  const [saveStatus, setSaveStatus] = useState("変更すると自動保存します");
  const saved = useRef(JSON.stringify(initial.document));
  const commit = (next: ReferenceRange) => dispatch({ type: "change", document: next });

  useEffect(() => {
    const value = JSON.stringify(document);
    if (saved.current === value) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, document }));
      saved.current = value;
      setSaveStatus("下書きをこのブラウザに保存済み");
    } catch {
      setSaveStatus("下書きを保存できません。JSONを書き出してください。");
    }
  }, [document]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]")) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" || key === "y") {
        event.preventDefault();
        dispatch({ type: key === "y" || event.shiftKey ? "redo" : "undo" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  let json = "", problem = "";
  try { json = JSON.stringify(parseReferenceRange(document), null, 2) + "\n"; }
  catch (error) { problem = (error as Error).message; }

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = parseReferenceRange(JSON.parse(await file.text()), file.name);
      commit(imported);
      setMessage(file.name + "を読み込みました。Undoで前の編集に戻れます。");
    } catch (error) { setMessage("読み込み失敗（現在の編集は維持）: " + String(error)); }
  };
  const download = () => {
    if (!json) return;
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = document.id + ".json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(document.id + ".jsonを書き出しました。登録用フォルダへ配置してください。");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setMessage("登録用JSONをコピーしました。");
    } catch { setMessage("コピーできませんでした。下のJSONを選択してコピーするか、ファイルを書き出してください。"); }
  };
  return <div className="reference-editor">
    <header className="editor-header">
      <div><p>LOCAL DEVELOPMENT ONLY</p><h1>参照レンジ作成</h1></div>
      <a href={import.meta.env.BASE_URL}>練習画面へ</a>
    </header>
    <p className="editor-intro">名前付きのCall / Raiseレンジを作成し、登録用JSONを書き出します。公開アプリやリポジトリへ直接保存する画面ではありません。</p>
    <div className="editor-layout">
      <section className="editor-canvas">
        <div className="editor-toolbar">
          <div className="button-group">
            <button className={group === "call" ? "active tool-call" : "tool-call"} aria-pressed={group === "call"} onClick={() => setGroup("call")}>Call</button>
            <button className={group === "raise" ? "active tool-raise" : "tool-raise"} aria-pressed={group === "raise"} onClick={() => setGroup("raise")}>Raise</button>
          </div>
          <select aria-label="編集操作" value={action} onChange={event => setAction(event.target.value as EditorAction)}>
            <option value="add">追加</option><option value="remove">選択グループから消す</option><option value="clear">両方から消す</option>
          </select>
          <button aria-pressed={rectangle} className={rectangle ? "active" : ""} onClick={() => setRectangle(!rectangle)}>矩形</button>
          <button disabled={!history.past.length} onClick={() => dispatch({ type: "undo" })}>Undo</button>
          <button disabled={!history.future.length} onClick={() => dispatch({ type: "redo" })}>Redo</button>
        </div>
        <ReferenceEditorGrid document={document} group={group} action={action} rectangle={rectangle} onCommit={commit} />
        <p className="editor-tip">左ドラッグで操作・右ドラッグで選択中のグループだけ消去。Shiftで矩形、Escでキャンセル。CallとRaiseは重ねて指定できます。</p>
        <p className="editor-count">Call {document.groups.call?.length || 0} hands / Raise {document.groups.raise?.length || 0} hands / 重複 {document.groups.call?.filter(key => document.groups.raise?.includes(key)).length || 0} hands</p>
      </section>
      <aside className="editor-settings">
        <section>
          <h2>レンジ情報</h2>
          <label>名前<input value={document.name} placeholder="SB vs UTG" onChange={event => commit({ ...document, name: event.target.value })} /></label>
          <label>ID / ファイル名<input value={document.id} placeholder="sb-vs-utg" onChange={event => commit({ ...document, id: event.target.value })} /></label>
          <p className="editor-tip">IDは英数字とハイフン。ファイル名は「ID.json」です。</p>
          {referenceRanges.some(range => range.id === document.id) && <p className="editor-tip">既存のIDです。書き出したファイルで同名のJSONを置き換えると更新できます。</p>}
        </section>
        <section>
          <h2>読み込み・新規作成</h2>
          <div className="editor-load">
            <select aria-label="既存の参照レンジ" value={presetId} onChange={event => setPresetId(event.target.value)}>
              {referenceRanges.map(range => <option key={range.id} value={range.id}>{range.name}</option>)}
            </select>
            <button disabled={!presetId} onClick={() => {
              const range = referenceRanges.find(item => item.id === presetId);
              if (range) { commit(parseReferenceRange(range)); setMessage(range.name + "を読み込みました。"); }
            }}>読込</button>
          </div>
          <label>JSONファイル<input type="file" accept=".json,application/json" onChange={importFile} /></label>
          <button onClick={() => { commit(blank()); setMessage("新規作成に切り替えました。Undoで前の編集に戻れます。"); }}>新規作成</button>
        </section>
        <section>
          <h2>登録用データ</h2>
          {problem && <p className="editor-error">{problem}</p>}
          <div className="button-group">
            <button disabled={!json} onClick={download}>JSONを書き出す</button>
            <button disabled={!json} onClick={copy}>コピー</button>
          </div>
          <p className="editor-tip">src/data/reference-ranges/へ配置し、npm run validate:rangesで確認してからビルド・デプロイしてください。</p>
          <details><summary>JSONを表示</summary><textarea aria-label="登録用JSON" readOnly value={json || JSON.stringify(document, null, 2)} rows={10} /></details>
        </section>
        <p className="editor-tip">{saveStatus}</p>
        <p className="editor-message" role="status">{message}</p>
      </aside>
    </div>
  </div>;
}
