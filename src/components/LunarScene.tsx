import { ArrowUpRight } from "lucide-react";
import { dateLabel, today } from "../domain";
import { moonSnapshot, tonightMoment } from "../moon";
import { MoonVisual } from "./Moon";

export default function LunarScene({
  name,
  onTonight,
}: {
  name: string;
  onTonight: () => void;
}) {
  const date = tonightMoment(today());
  const moon = moonSnapshot(date);
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12
      ? "Good morning"
      : hour >= 12 && hour < 18
        ? "Hello"
        : "Good evening";
  return (
    <section className="lunar-scene" aria-label="Your night and tonight’s moon">
      <div className="scene-copy">
        <p className="scene-greeting">
          {greeting}
          {name ? `, ${name}` : ""}
          <span className="greeting-star" aria-hidden="true">
            ✧
          </span>
        </p>
        <h1>
          Make room
          <br />
          <em>for rest.</em>
        </h1>
        <p className="scene-whisper">One night at a time.</p>
      </div>
      <div className="scene-moon">
        <svg
          viewBox="0 0 210 210"
          className="celestial-lines"
          aria-hidden="true"
        >
          <ellipse
            cx="105"
            cy="105"
            rx="95"
            ry="73"
            transform="rotate(-35 105 105)"
          />
          <ellipse cx="105" cy="105" rx="97" ry="95" />
          <path d="M38 41 66 24 89 34M159 160 178 178 191 162" />
          <circle cx="38" cy="41" r="2" />
          <circle cx="66" cy="24" r="2" />
          <circle cx="159" cy="160" r="2" />
          <circle cx="191" cy="162" r="2" />
        </svg>
        <MoonVisual date={date} size={150} />
        <span className="scene-star" aria-hidden="true">
          ✦
        </span>
      </div>
      <button
        className="scene-phase"
        onClick={onTonight}
        aria-label={`Tonight’s ${moon.name}, ${moon.percent}% illuminated. Open Tonight.`}
      >
        <span className="phase-live-dot" />
        <span>
          <strong>{moon.name}</strong>
          <small>
            {moon.percent}% illuminated · {dateLabel(today())} at 9 pm
          </small>
        </span>
        <ArrowUpRight size={18} />
      </button>
    </section>
  );
}
