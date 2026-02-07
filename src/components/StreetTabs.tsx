import { Street } from "../types";

type Props = {
  currentStreet: Street;
  onStreetChange: (street: Street) => void;
};

const STREETS: { value: Street; label: string }[] = [
  { value: "pre", label: "Pre" },
  { value: "flop", label: "Flop" },
  { value: "turn", label: "Turn" },
  { value: "river", label: "River" },
];

export function StreetTabs({ currentStreet, onStreetChange }: Props) {
  return (
    <div className="street-tabs">
      {STREETS.map((street) => (
        <button
          key={street.value}
          className={`street-tab ${currentStreet === street.value ? "active" : ""}`}
          onClick={() => onStreetChange(street.value)}
        >
          {street.label}
        </button>
      ))}
    </div>
  );
}
