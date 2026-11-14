import { useState } from "react";
import { ChevronRight, FlaskConical } from "lucide-react";
import {
  average,
  consistency,
  durationLabel,
  patterns,
  recent,
  sleepMinutes,
  type Entry,
} from "../domain";
import { PatternBars } from "./Charts";
import Segmented from "./Segmented";
import RestedChart from "./RestedChart";

export default function Discover({
  entries,
  goal,
}: {
  entries: Entry[];
  goal: number;
}) {
  const [tab, setTab] = useState<"overview" | "patterns">("overview");
  const [hasInteracted, setHasInteracted] = useState(false);
  const selectTab = (next: typeof tab) => {
    if (next !== tab) {
      setHasInteracted(true);
      setTab(next);
    }
  };
  const week = recent(entries, 7);
  const month = recent(entries, 30);
  const comparisons = patterns(month);
  const ready = comparisons.filter((p) => p.ready);
  const regularity = consistency(week);
  return (
    <div className="view discover-view">
      <div className="page-intro lab-intro">
        <h1>Discover</h1>
      </div>
      <Segmented
        options={[
          { value: "overview", label: "Insights" },
          { value: "patterns", label: "Detective" },
        ]}
        value={tab}
        onChange={selectTab}
        label="Discovery view"
      />
      <div key={tab} className="discovery-content" data-animate={hasInteracted}>
        {tab === "overview" && (
          <>
            <section className="insight-feature lab-lead">
              <h2>Past 7 days</h2>
              <div className="lab-average">
                {week.length
                  ? durationLabel(average(week.map(sleepMinutes)))
                  : "—"}
                <span>your nightly average</span>
              </div>
              <p>
                {week.length
                  ? `${week.length} nights logged · ${week.filter((e) => sleepMinutes(e) >= goal * 60).length} met your ${goal}-hour goal`
                  : "Log a night to see your weekly average."}
              </p>
            </section>
            <details className="more-panel discover-details">
              <summary>
                Rested ratings and bedtime variation{" "}
                <ChevronRight size={16} aria-hidden="true" />
              </summary>
              <div className="stats-pair">
                <div className="card mini-stat">
                  <span>Rested, on average</span>
                  <strong>
                    {week.length
                      ? average(week.map((e) => e.quality)).toFixed(1)
                      : "—"}
                    <small> / 5</small>
                  </strong>
                  <p>Your own morning rating</p>
                </div>
                <div className="card mini-stat">
                  <span>Bedtime variation</span>
                  <strong>
                    {regularity === null ? "—" : regularity}
                    <small>{regularity === null ? "" : " min"}</small>
                  </strong>
                  <p>
                    {regularity === null
                      ? "Needs 3 logged nights"
                      : "Standard deviation · 7 days"}
                  </p>
                </div>
              </div>
              {week.length > 0 && <RestedChart entries={entries} />}
            </details>
            <button
              className="discovery-link"
              onClick={() => selectTab("patterns")}
            >
              <span className="icon-tile green">
                <FlaskConical size={21} />
              </span>
              <span>
                <strong>The pattern detective</strong>
                <small>
                  {ready.length
                    ? `${ready.length} habits ready to compare`
                    : "See which habits you can compare"}
                </small>
              </span>
              <ChevronRight size={19} />
            </button>
          </>
        )}
        {tab === "patterns" && (
          <>
            <div className="detective-intro">
              <span className="icon-tile green">
                <FlaskConical size={22} />
              </span>
              <div>
                <h2>Pattern detective</h2>
                <p>Compare tagged and untagged nights from the past 30 days.</p>
              </div>
            </div>
            {comparisons.map((p) => (
              <details className="card pattern-card" key={p.tag}>
                <summary className="section-heading">
                  <h3>{p.tag}</h3>
                  <span className={`pill ${p.ready ? "sage" : "subtle"}`}>
                    {p.ready ? "A possible pattern" : "Gathering clues"}
                  </span>
                </summary>
                {p.ready ? (
                  <>
                    <p className="pattern-finding">
                      <strong>{Math.round(Math.abs(p.difference))} min</strong>{" "}
                      {p.difference >= 0 ? "more" : "less"} sleep on tagged
                      nights
                    </p>
                    <PatternBars pattern={p} />
                  </>
                ) : (
                  <>
                    <p className="muted small">
                      We need at least 3 nights in each group before making a
                      comparison.
                    </p>
                    <div className="sample-counts">
                      <span>{p.withCount}/3 tagged nights</span>
                      <span>{p.withoutCount}/3 untagged nights</span>
                    </div>
                  </>
                )}
                <p className="caption">
                  “Not tagged” may mean the habit wasn’t recorded. This
                  comparison cannot establish cause.
                </p>
              </details>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
