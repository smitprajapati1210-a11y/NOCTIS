import { useId, useState } from "react";
import { chartDays, dateLabel, type Entry } from "../domain";

export default function RestedChart({ entries }: { entries: Entry[] }) {
  const slots = chartDays(entries, 7);
  const id = useId().replace(/:/g, "");
  const [selected, setSelected] = useState<Entry | null>(null);
  const x = (i: number) => 12 + i * 46;
  const y = (q: number) => 116 - (q - 1) * 23;
  let path = "";
  let previous = false;
  slots.forEach(({ entry }, i) => {
    if (entry) {
      path += `${previous ? " L" : " M"}${x(i)},${y(entry.quality)}`;
      previous = true;
    } else previous = false;
  });
  return (
    <div
      className="rested-plot"
      role="group"
      aria-label="7-day rested rating chart"
    >
      <div className="rested-chart-canvas">
        <svg viewBox="0 0 300 142" aria-hidden="true">
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#9e7fc4" />
              <stop offset="1" stopColor="#dfc4f4" />
            </linearGradient>
          </defs>
          {[24, 70, 116].map((pos) => (
            <line
              key={pos}
              x1="8"
              y1={pos}
              x2="294"
              y2={pos}
              stroke="#b49ac618"
              strokeDasharray="2 5"
            />
          ))}
          <path
            d={path}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {slots.map(
            ({ entry, date }, i) =>
              entry && (
                <g key={date}>
                  <circle
                    cx={x(i)}
                    cy={y(entry.quality)}
                    r="8"
                    fill="#c6a2e318"
                  />
                  <circle
                    cx={x(i)}
                    cy={y(entry.quality)}
                    r="3.5"
                    fill="#e4c7fa"
                    stroke="#392347"
                    strokeWidth="2"
                  />
                </g>
              ),
          )}
        </svg>
        {slots.map(
          ({ entry, date }, i) =>
            entry && (
              <button
                className="rested-point"
                key={date}
                style={{
                  left: `${x(i) / 3}%`,
                  top: `${(y(entry.quality) / 142) * 100}%`,
                }}
                aria-label={`${dateLabel(date)}: ${entry.quality} out of 5 rested`}
                onClick={() => setSelected(entry)}
              />
            ),
        )}
      </div>
      <div className="rested-axis">
        {slots.map(({ date }) => (
          <span key={date}>{dateLabel(date, { weekday: "narrow" })}</span>
        ))}
      </div>
      <p className="rested-selection" role="status">
        {selected
          ? `${dateLabel(selected.date)} · ${selected.quality}/5 rested`
          : slots.some((s) => s.entry)
            ? "Tap a point to revisit a morning."
            : "Your first rating will start the line."}
      </p>
    </div>
  );
}
