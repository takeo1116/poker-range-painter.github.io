import { parseScenario } from "./rangeScenario";
import type { RangeScenario } from "./rangeScenario";
export type ReferenceGroup = "call" | "raise";
export type ReferenceRange = {
  id: string;
  name: string;
  scenario?: RangeScenario;
  groups: Partial<Record<ReferenceGroup, string[]>>;
};

const ranks = "AKQJT98765432";
function isCellKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const a = ranks.indexOf(value[0]), b = ranks.indexOf(value[1]);
  return a >= 0 && b >= 0 && (value.length === 2 ? a === b
    : value.length === 3 && a < b && (value[2] === "s" || value[2] === "o"));
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// 本番データ・ファイル読み込み・書き出しで同じ検証を使う。下書きだけは未入力の名前やIDを許可する。
export function parseReferenceRange(value: unknown, source = "レンジ", draft = false): ReferenceRange {
  const fail = (message: string): never => { throw new Error(source + ": " + message); };
  if (!object(value)) return fail("オブジェクトが必要です");
  if (Object.keys(value).some(key => !["id", "name", "groups", "scenario"].includes(key))) return fail("不明な項目があります");
  if (typeof value.id !== "string" || (!draft && !/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(value.id))) return fail("idは英数字とハイフンで指定してください");
  if (typeof value.name !== "string" || (!draft && !value.name.trim())) return fail("nameを入力してください");
  if (!object(value.groups) || !Object.keys(value.groups).length) return fail("groupsにcallまたはraiseが必要です");
  const groups: ReferenceRange["groups"] = {};
  for (const [key, cells] of Object.entries(value.groups)) {
    if (key !== "call" && key !== "raise") return fail("不明なグループ: " + key);
    if (!Array.isArray(cells)) return fail(key + "は配列で指定してください");
    const seen = new Set<string>();
    for (const cell of cells) {
      if (!isCellKey(cell)) return fail(key + "のハンド表記が不正です: " + String(cell));
      if (seen.has(cell)) return fail(key + "内でハンドが重複しています: " + cell);
      seen.add(cell);
    }
    groups[key] = [...seen];
  }
  // グループをまたぐ重複は混合アクションとして意図的に許可する。
  let scenario: RangeScenario | undefined;
  if (value.scenario !== undefined) {
    try { scenario = parseScenario(value.scenario); }
    catch (error) { return fail((error as Error).message); }
  }
  return { id: value.id, name: value.name, groups, ...(scenario ? { scenario } : {}) };
}

export function validateReferenceCollection(entries: Record<string, unknown>): ReferenceRange[] {
  const ids = new Set<string>();
  return Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)).map(([file, value]) => {
    const range = parseReferenceRange(value, file);
    if (ids.has(range.id)) throw new Error(file + ": idが重複しています: " + range.id);
    ids.add(range.id);
    const filename = file.split(/[\\/]/).pop();
    if (filename !== range.id + ".json") throw new Error(file + ": ファイル名は " + range.id + ".json にしてください");
    return range;
  });
}
