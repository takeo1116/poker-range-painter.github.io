import { generateCellKeys } from "../utils/rangeMatrix";
import { generateCombosForCell } from "../utils/combos";
import type { ReferenceRange } from "../utils/referenceRanges";
export const HANDS = generateCellKeys();
export const ACTIONS = ["Fold", "Call", "Raise"] as const;
export type Action = typeof ACTIONS[number];
export type Settings = { rangeIds: string[]; hands: string[] };
export type Question = { range: ReferenceRange; hand: string; combo: string };
export const STORAGE_KEY = "range-painter.trainer.settings.v1";
export function restoreSettings(raw: string | null, ranges: ReferenceRange[]): Settings {
  const fallback = { rangeIds: ranges.map(r => r.id), hands: [...HANDS] };
  try {
    const value = JSON.parse(raw ?? "null");
    if (!value || value.version !== 1 || !Array.isArray(value.rangeIds) || !Array.isArray(value.hands)) return fallback;
    return { rangeIds: fallback.rangeIds.filter(id => value.rangeIds.includes(id)), hands: HANDS.filter(h => value.hands.includes(h)) };
  } catch { return fallback; }
}
export function correctActions(range: ReferenceRange, hand: string): Action[] {
  const result: Action[] = [];
  if (range.groups.call?.includes(hand)) result.push("Call");
  if (range.groups.raise?.includes(hand)) result.push("Raise");
  return result.length ? result : ["Fold"];
}
// 教材の各ハンドを等確率で出す。コンボ数による重み付けはしない。
export function drawQuestion(settings: Settings, ranges: ReferenceRange[], random = Math.random): Question | null {
  const eligible = ranges.filter(r => settings.rangeIds.includes(r.id));
  const hands = HANDS.filter(h => settings.hands.includes(h));
  if (!eligible.length || !hands.length) return null;
  const pick = <T,>(items: T[]): T => items[Math.floor(random() * items.length)];
  const range = pick(eligible), hand = pick(hands);
  return { range, hand, combo: pick(generateCombosForCell(hand)) };
}
