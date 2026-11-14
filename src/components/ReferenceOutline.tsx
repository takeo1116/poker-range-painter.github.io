type Props = { call: boolean; raise: boolean };

// 塗り・選択の枠とは別レイヤーにし、参照が両グループに属する場合も片方を隠さない。
export function ReferenceOutline({ call, raise }: Props) {
  return <span className="reference-outline" aria-hidden="true">
    {call && <span className="reference-call" />}
    {raise && <span className={call ? "reference-raise reference-inner" : "reference-raise"} />}
  </span>;
}
