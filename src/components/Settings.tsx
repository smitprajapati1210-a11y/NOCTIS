import {
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { today, type Store } from "../domain";
import { downloadJson, freshStore, parseStore, STORAGE_KEY } from "../storage";

export default function Settings({
  store,
  setStore,
  storageError,
  onRecover,
  notify,
  onClose,
}: {
  store: Store;
  setStore: Dispatch<SetStateAction<Store>>;
  storageError: string;
  onRecover: () => void;
  notify: (s: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(store.preferences.name);
  const [goal, setGoal] = useState(store.preferences.goal);
  const [pending, setPending] = useState<Store | null>(null);
  const [error, setError] = useState("");
  const [clear, setClear] = useState(false);
  const [recover, setRecover] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  function save(e: FormEvent) {
    e.preventDefault();
    setStore((s) => ({
      ...s,
      preferences: { ...s.preferences, name: name.trim(), goal },
    }));
    notify("Your preferences are saved.");
    onClose();
  }
  async function load(file?: File) {
    if (!file) return;
    setError("");
    setPending(null);
    try {
      if (file.size > 2_000_000)
        throw new Error("Choose a backup smaller than 2 MB.");
      const imported = parseStore(JSON.parse(await file.text()));
      setPending(imported);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "This backup could not be read.",
      );
    }
    if (fileInput.current) fileInput.current.value = "";
  }
  return (
    <div className="settings-content">
      <form onSubmit={save}>
        <p className="eyebrow">MAKE YOURSELF AT HOME</p>
        <label className="field">
          What should we call you?
          <input
            maxLength={40}
            placeholder="Your first name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          Your sleep goal<span className="goal-value">{goal} hours</span>
          <input
            type="range"
            min="6"
            max="10"
            step="0.25"
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          />
        </label>
        <p className="caption">
          A personal time-in-bed target for planning. Choose what works for you.
        </p>
        <button type="submit" className="primary full">
          <Check size={17} />
          Save preferences
        </button>
      </form>
      <div className="settings-section">
        <h3>Your own little space</h3>
        <div className="privacy-note">
          <ShieldCheck size={22} />
          <p>
            Entries stay in this browser on this device. There is no account,
            cloud sync, tracking, or connected AI in this version.
          </p>
        </div>
        <p className="muted small">
          Clearing browser data removes your journal. Keep a backup. A Mac and
          an iPhone have separate journals, even on the same Wi-Fi.
        </p>
        <div className="button-row">
          <button
            className="secondary"
            onClick={() => {
              downloadJson(store, `noctis-backup-${today()}.json`);
              notify(
                `Backup prepared: ${store.entries.length} personal nights.`,
              );
            }}
          >
            <ArrowDownToLine size={16} />
            Export backup
          </button>
          <button
            className="secondary"
            onClick={() => fileInput.current?.click()}
          >
            <ArrowUpFromLine size={16} />
            Import backup
          </button>
        </div>
        <input
          hidden
          type="file"
          accept="application/json,.json"
          ref={fileInput}
          onChange={(e) => {
            void load(e.target.files?.[0]);
          }}
          aria-label="Import journal backup"
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {pending && (
          <div className="import-confirm">
            <h4>
              Restore {pending.entries.length}{" "}
              {pending.entries.length === 1 ? "night" : "nights"}?
            </h4>
            <p>
              This replaces the {store.entries.length} nights and preferences on
              this device. Export your current journal first if you want to keep
              it.
            </p>
            <div className="button-row">
              <button className="secondary" onClick={() => setPending(null)}>
                Cancel
              </button>
              <button
                className="primary"
                onClick={() => {
                  setStore({
                    ...pending,
                    preferences: { ...pending.preferences, demo: false },
                    timer: { endAt: null, remaining: 180 },
                  });
                  setName(pending.preferences.name);
                  setGoal(pending.preferences.goal);
                  setPending(null);
                  onRecover();
                  notify("Your backup has been restored.");
                }}
              >
                Replace & restore
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="settings-section">
        <div className="section-heading">
          <div>
            <h3>Explore sample nights</h3>
            <p className="muted small">Samples never mix with your journal.</p>
          </div>
          <button
            className={`switch ${store.preferences.demo ? "on" : ""}`}
            role="switch"
            aria-checked={store.preferences.demo}
            aria-label="Explore sample nights"
            onClick={() =>
              setStore((s) => ({
                ...s,
                preferences: { ...s.preferences, demo: !s.preferences.demo },
              }))
            }
          >
            <span />
          </button>
        </div>
      </div>
      <div className="settings-section">
        <h3>
          <Smartphone size={18} /> Made for your iPhone
        </h3>
        <p className="muted small">
          On the same Wi-Fi as your Mac, open the Network address printed by the
          dev server in Safari. For Home Screen use, open Share → Add to Home
          Screen. Reliable offline mode needs a trusted HTTPS address.
        </p>
        <p className="caption">
          This is a mobile web app. It doesn’t record sleep automatically, set
          alarms, or connect to Apple Health.
        </p>
      </div>
      {storageError && (
        <div className="settings-section storage-warning">
          <h3>Recover saved data</h3>
          <p>{storageError}</p>
          <button
            className="secondary full"
            onClick={() => {
              try {
                const raw = localStorage.getItem(STORAGE_KEY);
                downloadJson(
                  raw ? JSON.parse(raw) : { error: "No stored copy found" },
                  `noctis-recovery-${today()}.json`,
                );
              } catch {
                try {
                  downloadJson(
                    { raw: localStorage.getItem(STORAGE_KEY) },
                    `noctis-recovery-${today()}.json`,
                  );
                } catch {
                  setError(
                    "Browser storage is unavailable. Try allowing website storage.",
                  );
                }
              }
            }}
          >
            Download stored copy
          </button>
          {recover ? (
            <div className="delete-confirm">
              <p>
                Replace the unreadable saved copy with a fresh journal? Download
                it first.
              </p>
              <button
                className="danger full"
                onClick={() => {
                  setStore(freshStore());
                  onRecover();
                  setRecover(false);
                  notify("A fresh journal is ready.");
                }}
              >
                Reset unreadable storage
              </button>
            </div>
          ) : (
            <button
              className="text-button destructive"
              onClick={() => setRecover(true)}
            >
              Reset unreadable storage
            </button>
          )}
        </div>
      )}
      <div className="settings-section">
        <button
          className="text-button destructive"
          onClick={() => setClear(!clear)}
        >
          Erase my personal journal
        </button>
        {clear && (
          <div className="delete-confirm">
            <p>
              Erase all {store.entries.length} personal nights on this device?
              This cannot be undone. Samples will still be available.
            </p>
            <div className="button-row">
              <button className="secondary" onClick={() => setClear(false)}>
                Keep journal
              </button>
              <button
                className="danger"
                onClick={() => {
                  setStore((s) => ({
                    ...s,
                    entries: [],
                    preferences: { ...s.preferences, demo: false },
                  }));
                  setClear(false);
                  notify("Your personal journal has been erased.");
                }}
              >
                Erase journal
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="version-label">
        NOCTIS 0.1 · A little reflection. A better night.
      </p>
    </div>
  );
}
