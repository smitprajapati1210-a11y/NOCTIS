import { useState, type FormEvent } from "react";
import { Check, Coffee, Moon, Sun, Trash2 } from "lucide-react";
import NightMoon from "./Moon";
import { entryMoment } from "../moon";
import {
  durationLabel,
  entryError,
  sleepMinutes,
  TAGS,
  today,
  type Entry,
} from "../domain";

export default function EntryForm({
  entry,
  initialDate,
  entries,
  onSave,
  onDelete,
}: {
  entry?: Entry;
  initialDate?: string;
  entries: Entry[];
  onSave: (e: Entry) => void;
  onDelete: (e: Entry) => void;
}) {
  const [draft, setDraft] = useState<Entry>(
    entry ?? {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `night-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: initialDate ?? today(),
      bedtime: "23:00",
      wakeTime: "07:00",
      latency: 15,
      awake: 0,
      quality: 4,
      tags: [],
      note: "",
    },
  );
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const update = <K extends keyof Entry>(key: K, value: Entry[K]) => {
    setDraft((s) => ({ ...s, [key]: value }));
    setError("");
  };
  function save(e: FormEvent) {
    e.preventDefault();
    const invalid = entryError(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (entries.some((x) => x.date === draft.date && x.id !== draft.id)) {
      setError(
        "You already have a night for this wake-up date. Edit that entry in your journal.",
      );
      return;
    }
    onSave(draft);
  }
  return (
    <form className="entry-form" onSubmit={save}>
      <p className="muted small">A moment to notice how your night felt.</p>
      <label className="field">
        Wake-up date
        <input
          type="date"
          value={draft.date}
          max={today()}
          required
          onChange={(e) => update("date", e.target.value)}
        />
      </label>
      <div className="field-grid">
        <label className="field">
          <span>
            <Moon size={15} /> Went to bed
          </span>
          <input
            type="time"
            value={draft.bedtime}
            required
            onChange={(e) => update("bedtime", e.target.value)}
          />
        </label>
        <label className="field">
          <span>
            <Sun size={15} /> Woke up
          </span>
          <input
            type="time"
            value={draft.wakeTime}
            required
            onChange={(e) => update("wakeTime", e.target.value)}
          />
        </label>
      </div>
      <p className="caption">
        Times cross midnight automatically. Date is the morning you woke up.
      </p>
      <div className="field-grid">
        <label className="field">
          Time to fall asleep{" "}
          <span className="input-suffix">
            <input
              type="number"
              min="0"
              max="180"
              required
              value={draft.latency}
              onChange={(e) => update("latency", Number(e.target.value))}
            />
            <span>min</span>
          </span>
        </label>
        <label className="field">
          Awake during night
          <span className="input-suffix">
            <input
              type="number"
              min="0"
              max="240"
              required
              value={draft.awake}
              onChange={(e) => update("awake", Number(e.target.value))}
            />
            <span>min</span>
          </span>
        </label>
      </div>
      <div className="duration-preview">
        <Moon size={17} />
        <span>Estimated time asleep</span>
        <strong>{durationLabel(sleepMinutes(draft))}</strong>
      </div>
      {!entryError(draft) && <NightMoon date={entryMoment(draft)} compact />}
      <fieldset className="rating-field">
        <legend>How rested do you feel?</legend>
        <div className="ratings">
          {["Drained", "Low", "Okay", "Rested", "Bright"].map((label, i) => (
            <button
              key={label}
              type="button"
              aria-pressed={draft.quality === i + 1}
              onClick={() => update("quality", i + 1)}
              className={draft.quality === i + 1 ? "active" : ""}
            >
              <span>{["◡", "◔", "◐", "◕", "●"][i]}</span>
              <small>{label}</small>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>What was part of your evening?</legend>
        <div className="tag-list">
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag ${draft.tags.includes(tag) ? "selected" : ""}`}
              aria-pressed={draft.tags.includes(tag)}
              onClick={() =>
                update(
                  "tags",
                  draft.tags.includes(tag)
                    ? draft.tags.filter((t) => t !== tag)
                    : [...draft.tags, tag],
                )
              }
            >
              {draft.tags.includes(tag) ? (
                <Check size={13} />
              ) : tag === "Late caffeine" ? (
                <Coffee size={13} />
              ) : null}
              {tag}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="field">
        A thought from the night <span className="optional">optional</span>
        <textarea
          placeholder="Anything on your mind, dreams, little wins…"
          rows={3}
          maxLength={2000}
          value={draft.note}
          onChange={(e) => update("note", e.target.value)}
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary full">
        <Check size={18} />
        {entry ? "Save changes" : "Save my night"}
      </button>
      {entry &&
        (confirm ? (
          <div className="delete-confirm">
            <p>Delete this night? You can’t undo this.</p>
            <div className="button-row">
              <button
                type="button"
                className="secondary"
                onClick={() => setConfirm(false)}
              >
                Keep night
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => onDelete(entry)}
              >
                Delete night
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="text-button destructive full"
            onClick={() => setConfirm(true)}
          >
            <Trash2 size={15} />
            Delete this night
          </button>
        ))}
    </form>
  );
}
