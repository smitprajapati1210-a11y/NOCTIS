import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Moon,
  NotebookPen,
  Smartphone,
} from "lucide-react";
import { demoEntries, today } from "../domain";
import { MoonVisual } from "../components/Moon";
import { tonightMoment } from "../moon";
import { SleepChart } from "../components/Charts";
import GlassSelector from "../components/GlassSelector";
import { changePage } from "../motion";
import { EntryFrame } from "./EntryFrame";

const chapters = [
  {
    name: "Welcome",
    title: "Let the day end.",
    copy: "For anyone who gets into bed and finds their mind is still busy. NOCTIS gives you somewhere to put the day down and understand how you slept.",
  },
  {
    name: "Journal",
    title: "Remember how you felt.",
    copy: "Log when you slept and how you felt in the morning. A few honest words are enough.",
  },
  {
    name: "Patterns",
    title: "See the week take shape.",
    copy: "Compare your nights and look for habits that tend to go with better rest. Tap a point to explore a sample night.",
  },
  {
    name: "Wind down",
    title: "Make room for rest.",
    copy: "Set a wind-down timer, check off a few small rituals and plan around the morning you actually have.",
  },
];

const ratings = ["Exhausted", "Tired", "Okay", "Rested", "Refreshed"];
const demoRituals = [
  { label: "Dim the lights", icon: Moon },
  { label: "Put the phone away", icon: Smartphone },
  { label: "Write down tomorrow’s first task", icon: NotebookPen },
];

export default function Walkthrough({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [rituals, setRituals] = useState<string[]>([]);
  const [duration, setDuration] = useState(15);
  const title = useRef<HTMLHeadingElement>(null);
  const viewport = useRef<HTMLElement>(null);
  const sample = useMemo(() => demoEntries(today()), []);
  const date = useMemo(() => tonightMoment(today()), []);
  const chapter = chapters[step];
  useEffect(() => {
    if (viewport.current) viewport.current.scrollTop = 0;
    title.current?.focus({ preventScroll: true });
  }, [step]);

  function go(next: number) {
    if (next === chapters.length) {
      changePage(onFinish);
      return;
    }
    changePage(() => setStep(next), next < step ? "backward" : "forward");
  }

  return (
    <EntryFrame
      headerAction={
        <button type="button" className="entry-link" onClick={onFinish}>
          Sign in
        </button>
      }
    >
      <main
        ref={viewport}
        className={`entry-stage entry-scene entry-scene-${step}`}
      >
        <div className="entry-scene-content" key={step}>
          {step === 0 && (
            <div className="entry-window">
              <img
                src="/onboarding/night-room.jpg"
                alt=""
                fetchPriority="high"
              />
              <span aria-hidden="true" className="entry-window-moon">
                <MoonVisual date={date} size={84} />
              </span>
            </div>
          )}
          <div className="entry-story">
            <h1 ref={title} tabIndex={-1}>
              {chapter.title}
            </h1>
            <p>{chapter.copy}</p>
          </div>
          {step === 1 && (
            <div className="entry-diary entry-illustration">
              <div className="entry-diary-heading">
                <NotebookPen size={19} aria-hidden="true" />
                <span>Sample journal</span>
              </div>
              <p className="entry-diary-note">“{sample[0].note}”</p>
              <div
                className="entry-rating"
                role="group"
                aria-label="Try a rested rating"
              >
                {ratings.map((label, index) => (
                  <button
                    type="button"
                    key={label}
                    aria-label={label}
                    aria-pressed={rating === index}
                    onClick={() => setRating(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <p className="entry-demo-caption" role="status">
                {rating === null
                  ? "Try rating how rested you feel."
                  : ratings[rating]}
              </p>
            </div>
          )}
          {step === 2 && (
            <div className="entry-chart entry-illustration">
              <div className="entry-chart-label">
                Sample sleep duration <span>7 nights</span>
              </div>
              <SleepChart entries={sample} goal={8} compact />
            </div>
          )}
          {step === 3 && (
            <div className="entry-rituals entry-illustration">
              <div className="entry-ritual-timer">
                <span>
                  <Clock3 size={15} aria-hidden="true" /> Sample timer
                </span>
                <strong>{duration}:00</strong>
                <GlassSelector
                  label="Try a wind-down duration"
                  options={[15, 30, 45].map((minutes) => ({
                    value: minutes,
                    label: `${minutes} min`,
                  }))}
                  value={duration}
                  onSelect={setDuration}
                />
              </div>
              <div className="entry-ritual-list">
                {demoRituals.map(({ label, icon: Icon }) => {
                  const checked = rituals.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={checked}
                      onClick={() =>
                        setRituals((current) =>
                          checked
                            ? current.filter((item) => item !== label)
                            : [...current, label],
                        )
                      }
                    >
                      <Icon size={17} aria-hidden="true" />
                      <span>{label}</span>
                      <span className="entry-check" aria-hidden="true">
                        {checked && <Check size={13} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="entry-footer">
        <div
          className="entry-progress"
          aria-label={`Step ${step + 1} of ${chapters.length}: ${chapter.name}`}
          role="group"
        >
          {chapters.map(({ name }, index) => (
            <span
              key={name}
              aria-hidden="true"
              data-state={
                index === step ? "current" : index < step ? "past" : "next"
              }
            />
          ))}
        </div>
        <div className="entry-navigation">
          {step > 0 && (
            <button
              className="entry-back"
              type="button"
              onClick={() => go(step - 1)}
              aria-label="Previous step"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <button
            className="entry-primary"
            type="button"
            onClick={() => go(step + 1)}
          >
            {step === 0
              ? "Explore NOCTIS"
              : step === chapters.length - 1
                ? "Continue to sign in"
                : "Continue"}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </EntryFrame>
  );
}
