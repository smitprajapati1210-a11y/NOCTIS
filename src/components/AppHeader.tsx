import { UserRound } from "lucide-react";
import { dateLabel } from "../domain";

export default function AppHeader({
  day,
  sample,
  onHome,
  onSettings,
}: {
  day: string;
  sample: boolean;
  onHome: () => void;
  onSettings: () => void;
}) {
  return (
    <header className="app-header noctis-header">
      <button
        className="noctis-brand"
        onClick={onHome}
        aria-label="NOCTIS home"
      >
        <svg
          className="noctis-brand-moon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M14.8 3.4a8.4 8.4 0 1 0 5.8 12.1A7.2 7.2 0 0 1 14.8 3.4Z"
            fill="currentColor"
          />
          <circle cx="19.2" cy="4.5" r="1" fill="currentColor" />
        </svg>
        <span className="noctis-brand-name">NOCTIS</span>
      </button>
      <div className="header-right">
        {sample ? (
          <span className="header-date sample-status">Sample nights</span>
        ) : (
          <time className="header-date" dateTime={day}>
            {dateLabel(day, { month: "short", day: "numeric" })}
          </time>
        )}
        <button
          className="avatar"
          onClick={onSettings}
          aria-label="Open settings"
        >
          <UserRound size={19} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
