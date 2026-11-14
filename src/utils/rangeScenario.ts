export const POSITIONS = ["UTG", "HJ", "CO", "BTN", "SB", "BB"] as const;
export type Position = typeof POSITIONS[number];
// 対応する状況は未オープンか、単独オープンに対する最初の応答のみ。
// openerの省略は未オープンを意味し、コール済み・3Bet後には流用しない。
export type RangeScenario = {
  tableSize: 6;
  hero: Position;
  opener?: Position;
  stackBb?: number;
  stakes?: string;
  openSizeBb?: number;
};
export function parseScenario(value: unknown): RangeScenario {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("scenarioはオブジェクトで指定してください");
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(k => !["tableSize", "hero", "opener", "stackBb", "stakes", "openSizeBb"].includes(k))) throw new Error("scenarioに不明な項目があります");
  if (v.tableSize !== 6 || !POSITIONS.includes(v.hero as Position)) throw new Error("scenarioは6maxの有効なポジションを指定してください");
  if (v.opener !== undefined && (!POSITIONS.includes(v.opener as Position) || POSITIONS.indexOf(v.opener as Position) >= POSITIONS.indexOf(v.hero as Position))) throw new Error("openerは自分より前のポジションを指定してください");
  if (v.opener === undefined && v.hero === "BB") throw new Error("BBの未オープン問題は登録できません");
  for (const key of ["stackBb", "openSizeBb"]) {
    if (v[key] !== undefined && (typeof v[key] !== "number" || !Number.isFinite(v[key]) || (v[key] as number) <= 1)) throw new Error(key + "は1より大きいbb数で指定してください");
  }
  if (typeof v.stackBb === "number" && typeof v.openSizeBb === "number" && v.openSizeBb > v.stackBb) throw new Error("Openサイズがスタックを超えています");
  if (v.stakes !== undefined && (typeof v.stakes !== "string" || !v.stakes.trim())) throw new Error("stakesは空でない文字列を指定してください");
  return { ...v } as RangeScenario;
}
export function scenarioSeats(scenario: RangeScenario) {
  const heroIndex = POSITIONS.indexOf(scenario.hero);
  return POSITIONS.map((position, index) => ({
    position,
    // 自分を手前に固定し、時計回りの座席順を維持する。
    slot: (index - heroIndex + 6) % 6,
    state: position === scenario.hero ? "hero" : position === scenario.opener ? "opener" : index < heroIndex ? "folded" : "waiting",
  }));
}
