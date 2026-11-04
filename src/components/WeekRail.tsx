import { chartDays, dateLabel, today, type Entry } from "../domain";

export default function WeekRail({
  entries,
  onSelect,
  onWrite,
}: {
  entries: Entry[];
  onSelect: (e: Entry) => void;
  onWrite: (date: string) => void;
}) {
  return (
    <section className="week-rail-section">
      <div className="week-rail-heading">
        <span>Your last seven mornings</span>
        <small>Tap to revisit or write</small>
      </div>
      <div className="week-rail" role="group" aria-label="Journal calendar">
        {chartDays(entries, 7).map(({ date, entry }) => (
          <button
            key={date}
            className={`${date === today() ? "today" : ""} ${entry ? "logged" : ""}`}
            aria-label={`${dateLabel(date, { weekday: "long", month: "short", day: "numeric" })}: ${entry ? "read this night" : "write a night"}`}
            onClick={() => (entry ? onSelect(entry) : onWrite(date))}
          >
            <span>{dateLabel(date, { weekday: "short" }).slice(0, 2)}</span>
            <strong>{dateLabel(date, { day: "numeric" })}</strong>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
