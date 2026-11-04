import { useId } from "react";
import { dateLabel, localDate } from "../domain";
import { illuminatedPath, moonSnapshot } from "../moon";

export function MoonVisual({ date, size = 74 }: { date: Date; size?: number }) {
  const moon = moonSnapshot(date);
  const id = useId().replace(/:/g, "");
  const lit = illuminatedPath(moon.fraction, moon.waxing);
  return (
    <svg
      className="moon-visual"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`${moon.name}, ${moon.percent}% illuminated`}
    >
      <defs>
        <radialGradient id={`${id}-dark`} cx="30%" cy="25%">
          <stop stopColor="#6b527d" />
          <stop offset="1" stopColor="#2d203d" />
        </radialGradient>
        <radialGradient id={`${id}-light`} cx="30%" cy="25%">
          <stop stopColor="#f5eafa" />
          <stop offset=".65" stopColor="#dac7e8" />
          <stop offset="1" stopColor="#ac8fc3" />
        </radialGradient>
        <clipPath id={`${id}-lit`}>
          <path d={lit} />
        </clipPath>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="39"
        fill={`url(#${id}-dark)`}
        stroke="#af8fc527"
        strokeWidth=".6"
      />
      <g opacity=".13" fill="#c8b1d8">
        <circle cx="34" cy="35" r="8" />
        <circle cx="38" cy="65" r="11" />
        <circle cx="65" cy="52" r="6" />
      </g>
      <path d={lit} fill={`url(#${id}-light)`} />
      <g clipPath={`url(#${id}-lit)`}>
        <g fill="#72578f" opacity=".16">
          <circle cx="34" cy="35" r="8" />
          <circle cx="38" cy="65" r="11" />
          <circle cx="65" cy="52" r="6" />
          <circle cx="60" cy="25" r="4" />
          <circle cx="26" cy="52" r="3" />
          <circle cx="54" cy="75" r="3" />
        </g>
        <g fill="none" stroke="#fff7ff" opacity=".22">
          <circle cx="34" cy="35" r="8" />
          <circle cx="38" cy="65" r="11" />
          <circle cx="65" cy="52" r="6" />
        </g>
      </g>
    </svg>
  );
}

export default function NightMoon({
  date,
  tonight = false,
  compact = false,
}: {
  date: Date;
  tonight?: boolean;
  compact?: boolean;
}) {
  const moon = moonSnapshot(date);
  return (
    <section
      className={`night-moon-card ${compact ? "compact" : ""}`}
      aria-label={
        tonight ? "Tonight’s moon phase" : "Moon phase for this night"
      }
    >
      <MoonVisual date={date} size={compact ? 49 : 68} />
      <div>
        <p className="eyebrow">
          {tonight ? "UNDER TONIGHT’S SKY" : "THE MOON THAT NIGHT"}
        </p>
        <h3>{moon.name}</h3>
        <p>
          {moon.percent}% illuminated · {dateLabel(localDate(date))}
          {tonight ? " · 9 pm" : ""}
        </p>
      </div>
      <span className="tiny-sparkle" aria-hidden="true">
        ✧
      </span>
    </section>
  );
}
