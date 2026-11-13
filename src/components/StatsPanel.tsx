import { Stats } from "../types";

type Props = { player: "hero" | "villain"; stats: Stats };

export function StatsPanel({ player, stats }: Props) {
  return (
    <dl className="stats-panel" aria-label={player === "hero" ? "Hero 集計" : "Villain 集計"}>
      <div className="stat-value"><dt>Value</dt><dd>{stats.valueCount}</dd></div>
      <div className="stat-bluff"><dt>Bluff</dt><dd>{stats.bluffCount}</dd></div>
      <div><dt>Total</dt><dd>{stats.includedTotal}</dd></div>
      <div><dt>Bluff : Value</dt><dd>{stats.bluffToValueRatio}</dd></div>
      <div><dt>Bluff %</dt><dd>{stats.bluffPercent}</dd></div>
    </dl>
  );
}
