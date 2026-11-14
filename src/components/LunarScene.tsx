import { Sparkle } from "lucide-react";
import { greetingForHour, localDate } from "../domain";
import { moonSnapshot, tonightMoment } from "../moon";
import { MoonVisual } from "./Moon";

export default function LunarScene({ name, now }: { name: string; now: Date }) {
  const date = tonightMoment(localDate(now));
  const moon = moonSnapshot(date);
  const greeting = greetingForHour(now.getHours());
  return (
    <section className="today-moon" aria-label="Tonight’s moon">
      <div>
        <h1>
          {greeting}
          {name ? `, ${name}` : ""}{" "}
          <Sparkle
            className="today-greeting-star"
            size={16}
            aria-hidden="true"
          />
        </h1>
        <p>
          {moon.name} · {moon.percent}% illuminated
        </p>
      </div>
      <div className="today-moon-art">
        <svg
          className="today-moon-orbit"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <ellipse
            cx="50"
            cy="50"
            rx="46"
            ry="33"
            transform="rotate(-35 50 50)"
          />
          <path d="M16 22 33 12 45 17M70 80 84 88 92 76" />
          <circle cx="16" cy="22" r="1.6" />
          <circle cx="33" cy="12" r="1.6" />
          <circle cx="84" cy="88" r="1.6" />
        </svg>
        <MoonVisual date={date} size={78} />
        <Sparkle
          className="today-moon-star"
          size={13}
          fill="currentColor"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
