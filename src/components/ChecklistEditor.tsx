import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import {
  WIND_DOWN_TASK_LIMIT,
  WIND_DOWN_TITLE_LIMIT,
  type WindDownTask,
} from "../domain";

const suggestions = [
  "Read a few pages",
  "Set out clothes for tomorrow",
  "Try a gentle stretch",
  "Write down a lingering thought",
  "Put on a quiet playlist",
  "Set your morning alarm",
  "Take a warm shower",
  "Switch off phone notifications",
];

function createTask(title: string): WindDownTask {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { id, title };
}

export default function ChecklistEditor({
  tasks,
  onSave,
}: {
  tasks: WindDownTask[];
  onSave: (tasks: WindDownTask[]) => void;
}) {
  const [draft, setDraft] = useState(tasks);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const names = new Set(draft.map((task) => task.title.trim().toLowerCase()));
  const available = suggestions
    .filter((suggestion) => !names.has(suggestion.toLowerCase()))
    .slice(0, 3);

  function add(value: string) {
    const clean = value.trim();
    if (!clean) return false;
    if (names.has(clean.toLowerCase())) {
      setError("That task is already in your checklist.");
      return false;
    }
    const task = createTask(clean);
    setDraft((previous) =>
      previous.length < WIND_DOWN_TASK_LIMIT ? [...previous, task] : previous,
    );
    setError("");
    return true;
  }

  function addCustom(event: FormEvent) {
    event.preventDefault();
    if (add(title)) setTitle("");
  }

  function save() {
    const next = draft.map((task) => ({ ...task, title: task.title.trim() }));
    const pending = title.trim();
    if (pending && next.length < WIND_DOWN_TASK_LIMIT) {
      if (names.has(pending.toLowerCase())) {
        setError("That task is already in your checklist.");
        return;
      }
      next.push(createTask(pending));
    }
    if (next.some((task) => !task.title)) {
      setError("Give each task a name or remove it.");
      return;
    }
    if (
      new Set(next.map((task) => task.title.toLowerCase())).size !== next.length
    ) {
      setError("Give each task a different name.");
      return;
    }
    onSave(next);
  }

  return (
    <div className="routine-editor">
      <form className="routine-add" onSubmit={addCustom}>
        <label className="field">
          New task
          <input
            placeholder="e.g. Read a chapter"
            maxLength={WIND_DOWN_TITLE_LIMIT}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError("");
            }}
            disabled={draft.length >= WIND_DOWN_TASK_LIMIT}
          />
        </label>
        <button
          className="primary"
          type="submit"
          aria-label="Add task"
          disabled={!title.trim() || draft.length >= WIND_DOWN_TASK_LIMIT}
        >
          <Plus size={19} aria-hidden="true" /> Add
        </button>
      </form>
      {available.length > 0 && draft.length < WIND_DOWN_TASK_LIMIT && (
        <div className="routine-suggestions">
          <h3>Suggestions from Noctis</h3>
          {available.map((suggestion) => (
            <button key={suggestion} onClick={() => add(suggestion)}>
              <Plus size={15} aria-hidden="true" /> {suggestion}
            </button>
          ))}
        </div>
      )}
      {draft.length >= WIND_DOWN_TASK_LIMIT && (
        <p className="caption">
          Your checklist has {WIND_DOWN_TASK_LIMIT} tasks.
        </p>
      )}
      {draft.length > 0 && (
        <div className="routine-task-edits">
          <h3>Your tasks</h3>
          {draft.map((task, index) => (
            <div key={task.id}>
              <input
                aria-label={`Task ${index + 1}`}
                value={task.title}
                maxLength={WIND_DOWN_TITLE_LIMIT}
                onChange={(event) => {
                  const updated = event.target.value;
                  setDraft((previous) =>
                    previous.map((item) =>
                      item.id === task.id ? { ...item, title: updated } : item,
                    ),
                  );
                  setError("");
                }}
              />
              <button
                type="button"
                aria-label={`Remove ${task.title || `task ${index + 1}`}`}
                onClick={() => {
                  setDraft((previous) =>
                    previous.filter((item) => item.id !== task.id),
                  );
                  setError("");
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="entry-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary full routine-save" onClick={save}>
        Save checklist
      </button>
    </div>
  );
}
