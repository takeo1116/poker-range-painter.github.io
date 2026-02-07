import { FLAG_DEFINITIONS } from "../utils/combos";
import { colorizeFlag } from "../utils/suitColors";

type Props = {
  selectedFlagId: string | null;
  onSelectFlag: (flagId: string) => void;
};

export function FlagPalette({ selectedFlagId, onSelectFlag }: Props) {
  // カテゴリごとにグループ化
  const suited = FLAG_DEFINITIONS.filter((f) => f.category === "suited");
  const upper = FLAG_DEFINITIONS.filter((f) => f.category === "upper");
  const lower = FLAG_DEFINITIONS.filter((f) => f.category === "lower");
  const twosuit = FLAG_DEFINITIONS.filter((f) => f.category === "twosuit");

  return (
    <div className="flag-palette">
      <h4>フラグ選択</h4>

      <div className="flag-row">
        {suited.map((flag) => (
          <button
            key={flag.id}
            className={`flag-button ${selectedFlagId === flag.id ? "selected" : ""}`}
            onClick={() => onSelectFlag(flag.id)}
            dangerouslySetInnerHTML={colorizeFlag(flag.label)}
          />
        ))}
      </div>

      <div className="flag-row">
        {upper.map((flag) => (
          <button
            key={flag.id}
            className={`flag-button ${selectedFlagId === flag.id ? "selected" : ""}`}
            onClick={() => onSelectFlag(flag.id)}
            dangerouslySetInnerHTML={colorizeFlag(flag.label)}
          />
        ))}
      </div>

      <div className="flag-row">
        {lower.map((flag) => (
          <button
            key={flag.id}
            className={`flag-button ${selectedFlagId === flag.id ? "selected" : ""}`}
            onClick={() => onSelectFlag(flag.id)}
            dangerouslySetInnerHTML={colorizeFlag(flag.label)}
          />
        ))}
      </div>

      <div className="flag-row">
        {twosuit.map((flag) => (
          <button
            key={flag.id}
            className={`flag-button ${selectedFlagId === flag.id ? "selected" : ""}`}
            onClick={() => onSelectFlag(flag.id)}
            dangerouslySetInnerHTML={colorizeFlag(flag.label)}
          />
        ))}
      </div>
    </div>
  );
}
