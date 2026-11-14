import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateLabel, dateOffset, weekEnding, type Entry } from "../domain";
import { SleepChart } from "./Charts";

export default function SleepHistory({
  entries,
  goal,
  currentWeek,
}: {
  entries: Entry[];
  goal: number;
  currentWeek: string;
}) {
  const weeks = [...new Set(entries.map(({ date }) => weekEnding(date)))]
    .filter((week) => week < currentWeek)
    .sort()
    .reverse();
  const [selected, setSelected] = useState(weeks[0]);
  const index = Math.max(0, weeks.indexOf(selected));
  const end = weeks[index];
  if (!end)
    return (
      <p className="muted">
        Weeks with logged nights will appear here after they end.
      </p>
    );

  return (
    <div className="sleep-history">
      <div className="sleep-history-controls">
        <button
          className="icon-button"
          aria-label="Older week"
          disabled={index === weeks.length - 1}
          onClick={() => setSelected(weeks[index + 1])}
        >
          <ChevronLeft size={19} aria-hidden="true" />
        </button>
        <select
          aria-label="Choose a week"
          value={end}
          onChange={(event) => setSelected(event.target.value)}
        >
          {weeks.map((week) => (
            <option key={week} value={week}>
              {dateLabel(dateOffset(week, -6))} –{" "}
              {dateLabel(week, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </option>
          ))}
        </select>
        <button
          className="icon-button"
          aria-label="Newer week"
          disabled={index === 0}
          onClick={() => setSelected(weeks[index - 1])}
        >
          <ChevronRight size={19} aria-hidden="true" />
        </button>
      </div>
      <SleepChart key={end} entries={entries} goal={goal} weekEnd={end} />
    </div>
  );
}
