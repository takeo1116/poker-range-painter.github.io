import { Stats } from "../types";

type Props = {
  player: "hero" | "villain";
  stats: Stats;
};

export function StatsPanel({ player, stats }: Props) {
  return (
    <div className="stats-panel">
      <h4>{player === "hero" ? "Hero" : "Villain"} 集計</h4>
      <div className="stats-row">
        <span>Value:</span>
        <span>{stats.valueCount}</span>
      </div>
      <div className="stats-row">
        <span>Bluff:</span>
        <span>{stats.bluffCount}</span>
      </div>
      <div className="stats-row">
        <span>Total:</span>
        <span>{stats.includedTotal}</span>
      </div>
      <div className="stats-row">
        <span>Bluff:Value:</span>
        <span>{stats.bluffToValueRatio}</span>
      </div>
      <div className="stats-row">
        <span>Bluff%:</span>
        <span>{stats.bluffPercent}</span>
      </div>
    </div>
  );
}
