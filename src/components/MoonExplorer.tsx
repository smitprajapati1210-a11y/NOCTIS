import { useState } from "react";
import { Sparkle } from "lucide-react";
import { dateLabel, dateOffset } from "../domain";
import { moonSnapshot, tonightMoment } from "../moon";
import { MoonVisual } from "./Moon";

const nearbyNights = [-2, -1, 0, 1, 2];

export default function MoonExplorer({ tonight }: { tonight: string }) {
  const [offset, setOffset] = useState(0);
  const selected = dateOffset(tonight, offset);
  const time = tonightMoment(selected);
  const moon = moonSnapshot(time);

  return (
    <div className="moon-explorer">
      <div className="moon-explorer-sky" aria-hidden="true">
        <div className="moon-explorer-orbit">
          <span className="moon-explorer-satellite">
            <Sparkle size={12} fill="currentColor" />
          </span>
        </div>
        <div key={selected} className="moon-explorer-disc">
          <MoonVisual date={time} size={148} />
        </div>
      </div>
      <div
        className="moon-explorer-readout"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="moon-explorer-date">
          {dateLabel(selected, {
            weekday: "long",
            day: "numeric",
            month: "short",
          })}{" "}
          · 9 pm
        </p>
        <h3>{moon.name}</h3>
        <p>{moon.percent}% illuminated</p>
      </div>
      <div
        className="moon-explorer-nights"
        role="group"
        aria-label="Choose a night"
      >
        {nearbyNights.map((night) => {
          const date = dateOffset(tonight, night);
          return (
            <button
              key={night}
              type="button"
              aria-label={
                night === 0
                  ? "Tonight"
                  : dateLabel(date, {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })
              }
              aria-pressed={offset === night}
              onClick={() => setOffset(night)}
            >
              {night === 0 ? "Tonight" : dateLabel(date, { weekday: "short" })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
