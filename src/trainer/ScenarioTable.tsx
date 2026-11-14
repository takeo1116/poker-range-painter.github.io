import { scenarioSeats } from "../utils/rangeScenario";
import type { RangeScenario } from "../utils/rangeScenario";
const seats = [[210, 184], [60, 151], [60, 57], [210, 24], [360, 57], [360, 151]];
export function ScenarioTable({ scenario }: { scenario: RangeScenario }) {
  const context = ["6max", scenario.stackBb !== undefined ? scenario.stackBb + "bb" : null, scenario.stakes].filter(Boolean).join(" · ");
  const open = scenario.openSizeBb !== undefined ? "Raise " + scenario.openSizeBb + "bb" : "Raise";
  const situation = scenario.opener ? scenario.opener + "のOpenに対応" : "自分まで未オープン";
  return <figure className="trainer-table">
    <figcaption>{context}{!scenario.opener && scenario.openSizeBb !== undefined && " · Open " + scenario.openSizeBb + "bb"}</figcaption>
    <svg viewBox="0 0 420 210" role="img" aria-label={context + "。自分は" + scenario.hero + "。" + situation + (scenario.opener && scenario.openSizeBb !== undefined ? "、" + scenario.openSizeBb + "bb" : "")}>
      <rect className="trainer-table-felt" x="40" y="25" width="340" height="158" rx="79" />
      <text className="trainer-table-caption" x="210" y="108" textAnchor="middle">{situation}</text>
      {scenarioSeats(scenario).map(seat => {
        const [x, y] = seats[seat.slot];
        const label = seat.state === "hero" ? "YOU" : seat.state === "opener" ? open : seat.state === "folded" ? "Fold" : "未アクション";
        return <g key={seat.position} transform={"translate(" + x + " " + y + ")"} className={"trainer-seat " + seat.state}>
          <rect x="-38" y="-23" width="76" height="46" rx="12" />
          <text className="trainer-seat-position" textAnchor="middle" y="-3">{seat.position}</text>
          <text className="trainer-seat-action" textAnchor="middle" y="13">{label}</text>
          {seat.position === "BTN" && <g className="trainer-dealer" transform="translate(43 -18)"><circle r="9" /><text textAnchor="middle" y="3.5">D</text></g>}
        </g>;
      })}
    </svg>
  </figure>;
}
