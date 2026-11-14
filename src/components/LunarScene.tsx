import { moonSnapshot, tonightMoment } from "../moon";
import { MoonVisual } from "./Moon";

export default function LunarScene({
  name,
  day,
}: {
  name: string;
  day: string;
}) {
  const date = tonightMoment(day);
  const moon = moonSnapshot(date);
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12
      ? "Good morning"
      : hour >= 12 && hour < 18
        ? "Hello"
        : "Good evening";
  return (
    <section className="today-moon" aria-label="Tonight’s moon">
      <div>
        <h1>
          {greeting}
          {name ? `, ${name}` : ""}.
        </h1>
        <p>
          {moon.name} · {moon.percent}% illuminated
        </p>
      </div>
      <MoonVisual date={date} size={78} />
    </section>
  );
}
