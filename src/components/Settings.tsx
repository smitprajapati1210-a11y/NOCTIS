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
  Camera,
  Check,
  ChevronDown,
  HardDrive,
  LogOut,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";
import { today, type Store } from "../domain";
import {
  PROFILE_NAME_LIMIT,
  validPhoneNumber,
  type ProfileAccount,
} from "../profile";
import { prepareProfilePhoto } from "./profilePhoto";
import { downloadJson, freshStore, parseStore, STORAGE_KEY } from "../storage";

export default function Settings({
  store,
  setStore,
  storageError,
  onRecover,
  notify,
  account,
  legacyStorageKey,
  storageKey = STORAGE_KEY,
}: {
  store: Store;
  setStore: Dispatch<SetStateAction<Store>>;
  storageError: string;
  onRecover: () => void;
  notify: (s: string) => void;
  account?: ProfileAccount;
  storageKey?: string;
  legacyStorageKey?: string;
}) {
  const savedName = account?.profileName ?? store.preferences.name;
  const savedPhoto = account?.profilePhoto ?? "";
  const savedPhone = account?.phoneNumber ?? "";
  const [name, setName] = useState(savedName);
  const [photo, setPhoto] = useState(savedPhoto);
  const [phone, setPhone] = useState(savedPhone);
  const [savingProfile, setSavingProfile] = useState(false);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const [goal, setGoal] = useState(store.preferences.goal);
  const [pending, setPending] = useState<Store | null>(null);
  const [importIsLegacy, setImportIsLegacy] = useState(false);
  const legacyClaimKey = legacyStorageKey ? `${legacyStorageKey}.claimed` : "";
  function canImportLegacy(): boolean {
    if (!legacyStorageKey || !localStorage.getItem(legacyStorageKey))
      return false;
    const owner = localStorage.getItem(legacyClaimKey);
    return !owner || owner === storageKey;
  }
  const [error, setError] = useState("");
  const [clear, setClear] = useState(false);
  const [recover, setRecover] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [legacyAvailable] = useState(() => {
    try {
      return canImportLegacy();
    } catch {
      return false;
    }
  });
  function previewLegacy() {
    if (!legacyStorageKey) return;
    setPending(null);
    setError("");
    try {
      if (!canImportLegacy()) throw new Error("Earlier journal unavailable.");
      const saved = localStorage.getItem(legacyStorageKey);
      if (!saved) throw new Error("No earlier journal was found.");
      setPending(parseStore(JSON.parse(saved)));
      setImportIsLegacy(true);
    } catch {
      setError(
        "The earlier journal couldn’t be read. Your current journal is still available.",
      );
    }
  }
  async function signOut() {
    if (!account || signingOut) return;
    setSigningOut(true);
    setAccountError("");
    try {
      await account.signOut();
    } catch {
      setAccountError("Couldn’t sign out. Try again.");
      setSigningOut(false);
    }
  }
  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (savingProfile || preparingPhoto) return;
    setProfileError("");
    setProfileSaved(false);
    const profile = {
      profileName: name.trim(),
      profilePhoto: photo,
      phoneNumber: phone.trim(),
    };
    if (!validPhoneNumber(profile.phoneNumber)) {
      setProfileError("Enter a valid phone number.");
      return;
    }
    setSavingProfile(true);
    try {
      await account?.updateProfile(profile);
      setStore((s) => ({
        ...s,
        preferences: { ...s.preferences, name: profile.profileName },
      }));
      setName(profile.profileName);
      setPhone(profile.phoneNumber);
      setProfileSaved(true);
    } catch {
      setProfileError("Couldn’t save your profile. Try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function selectPhoto(file: File) {
    setPreparingPhoto(true);
    setProfileError("");
    setProfileSaved(false);
    try {
      setPhoto(await prepareProfilePhoto(file));
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Couldn’t open this photo.",
      );
    } finally {
      setPreparingPhoto(false);
    }
  }

  function saveGoal(event: FormEvent) {
    event.preventDefault();
    setStore((s) => ({
      ...s,
      preferences: { ...s.preferences, goal },
    }));
    notify("Sleep goal saved.");
  }

  async function load(file?: File) {
    if (!file) return;
    setImportIsLegacy(false);
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
  function restoreBackup() {
    if (!pending) return;
    if (importIsLegacy) {
      try {
        if (!canImportLegacy()) throw new Error("Earlier journal unavailable.");
        localStorage.setItem(legacyClaimKey, storageKey);
      } catch {
        setError("The earlier journal couldn’t be assigned to this account.");
        return;
      }
    }
    setStore({
      ...pending,
      preferences: { ...pending.preferences, demo: false },
      timer: { endAt: null, remaining: 180 },
    });
    if (account?.profileName === undefined) setName(pending.preferences.name);
    setGoal(pending.preferences.goal);
    setPending(null);
    onRecover();
    notify("Your backup has been restored.");
  }

  function downloadRecovery() {
    setRecoveryError("");
    try {
      const raw = localStorage.getItem(storageKey);
      let copy: unknown = { error: "No stored copy found" };
      if (raw) {
        try {
          copy = JSON.parse(raw);
        } catch {
          copy = { raw };
        }
      }
      downloadJson(copy, `noctis-recovery-${today()}.json`);
    } catch {
      setRecoveryError("Browser storage is unavailable.");
    }
  }

  const samples = store.preferences.demo;
  const changed =
    name.trim() !== savedName ||
    photo !== savedPhoto ||
    phone.trim() !== savedPhone;
  return (
    <div className="profile-content">
      <form className="profile-card" onSubmit={saveProfile}>
        {account && (
          <div className="profile-identity">
            <button
              type="button"
              className="profile-avatar"
              aria-label={photo ? "Change profile photo" : "Add profile photo"}
              disabled={preparingPhoto || savingProfile}
              onClick={() => photoInput.current?.click()}
            >
              {photo ? (
                <img src={photo} alt="" />
              ) : (
                <UserRound size={30} strokeWidth={1.45} aria-hidden="true" />
              )}
              <span className="profile-camera" aria-hidden="true">
                <Camera size={13} />
              </span>
            </button>
            <div className="profile-identity-details">
              <p className="profile-email-label">Email</p>
              <p className="profile-email">{account.email}</p>
              {preparingPhoto && (
                <p className="profile-photo-status" role="status">
                  Preparing photo…
                </p>
              )}
              {photo && !preparingPhoto && (
                <button
                  type="button"
                  className="profile-photo-remove"
                  onClick={() => {
                    setPhoto("");
                    setProfileSaved(false);
                  }}
                  disabled={savingProfile}
                >
                  Remove photo
                </button>
              )}
            </div>
            <input
              hidden
              type="file"
              accept="image/*"
              aria-label="Choose a profile photo"
              ref={photoInput}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void selectPhoto(file);
                event.target.value = "";
              }}
            />
          </div>
        )}
        <label className="field">
          Display name
          <input
            type="text"
            maxLength={PROFILE_NAME_LIMIT}
            autoComplete="nickname"
            placeholder="What should we call you?"
            value={name}
            disabled={savingProfile}
            onChange={(event) => {
              setName(event.target.value);
              setProfileSaved(false);
            }}
          />
        </label>
        {account && (
          <label className="field">
            Phone number <span className="optional">Optional</span>
            <input
              type="tel"
              maxLength={30}
              autoComplete="tel"
              value={phone}
              disabled={savingProfile}
              onChange={(event) => {
                setPhone(event.target.value);
                setProfileSaved(false);
              }}
            />
          </label>
        )}
        {profileError && (
          <p className="form-error" role="alert">
            {profileError}
          </p>
        )}
        {profileSaved && (
          <p className="profile-saved" role="status">
            Profile saved
          </p>
        )}
        <button
          type="submit"
          className="primary full"
          disabled={savingProfile || preparingPhoto || !changed}
        >
          <Check size={17} aria-hidden="true" />{" "}
          {savingProfile ? "Saving…" : "Save profile"}
        </button>
      </form>

      <button
        type="button"
        className="profile-sample profile-row"
        role="switch"
        aria-checked={samples}
        aria-label="Explore sample nights"
        onClick={() =>
          setStore((s) => ({
            ...s,
            preferences: { ...s.preferences, demo: !s.preferences.demo },
          }))
        }
      >
        <span className="profile-row-icon" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <span>Explore sample nights</span>
        <span className="profile-toggle" aria-hidden="true" />
      </button>

      <div className="profile-controls">
        <details className="profile-panel">
          <summary className="profile-row">
            <span className="profile-row-icon" aria-hidden="true">
              <SlidersHorizontal size={17} />
            </span>
            <span>Preferences</span>
            <ChevronDown
              className="profile-chevron"
              size={17}
              aria-hidden="true"
            />
          </summary>
          <form
            className="profile-panel-content profile-preferences"
            onSubmit={saveGoal}
          >
            <label className="field profile-goal">
              Sleep goal
              <span aria-hidden="true">{goal} h</span>
              <input
                type="range"
                min="6"
                max="10"
                step="0.25"
                value={goal}
                aria-valuetext={`${goal} hours`}
                onChange={(event) => setGoal(Number(event.target.value))}
              />
            </label>
            <button
              type="submit"
              className="secondary full"
              disabled={goal === store.preferences.goal}
            >
              <Check size={17} aria-hidden="true" /> Save sleep goal
            </button>
          </form>
        </details>

        <details className="profile-panel">
          <summary className="profile-row">
            <span className="profile-row-icon" aria-hidden="true">
              <HardDrive size={17} />
            </span>
            <span>Journal backups</span>
            <ChevronDown
              className="profile-chevron"
              size={17}
              aria-hidden="true"
            />
          </summary>
          <div className="profile-panel-content profile-backups">
            <p>Your journal is saved in this browser.</p>
            <div className="button-row profile-backup-actions">
              <button
                className="secondary"
                onClick={() => {
                  downloadJson(store, `noctis-backup-${today()}.json`);
                  notify("Journal backup downloaded.");
                }}
              >
                <ArrowDownToLine size={16} aria-hidden="true" /> Export backup
              </button>
              <button
                className="secondary"
                onClick={() => fileInput.current?.click()}
              >
                <ArrowUpFromLine size={16} aria-hidden="true" /> Import backup
              </button>
            </div>
            {legacyAvailable && (
              <button className="secondary full" onClick={previewLegacy}>
                Import journal from before sign-in
              </button>
            )}
            <input
              hidden
              type="file"
              accept="application/json,.json"
              ref={fileInput}
              onChange={(event) => void load(event.target.files?.[0])}
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
                  This replaces the journal and preferences in this browser.
                </p>
                <div className="button-row">
                  <button
                    className="secondary"
                    onClick={() => setPending(null)}
                  >
                    Cancel
                  </button>
                  <button className="primary" onClick={restoreBackup}>
                    Replace & restore
                  </button>
                </div>
              </div>
            )}
            <button
              className="text-button destructive profile-erase"
              onClick={() => setClear(!clear)}
              aria-expanded={clear}
            >
              Erase my personal journal
            </button>
            {clear && (
              <div className="delete-confirm">
                <p>
                  Permanently erase {store.entries.length}{" "}
                  {store.entries.length === 1 ? "night" : "nights"} from this
                  browser?
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
        </details>
      </div>

      {storageError && (
        <section className="storage-warning profile-recovery">
          <h3>Recover saved data</h3>
          <p>{storageError}</p>
          {recoveryError && (
            <p className="form-error" role="alert">
              {recoveryError}
            </p>
          )}
          <button className="secondary full" onClick={downloadRecovery}>
            Download stored copy
          </button>
          {recover ? (
            <div className="delete-confirm">
              <p>
                Replace the unreadable copy with a fresh journal? Download it
                first.
              </p>
              <div className="button-row">
                <button className="secondary" onClick={() => setRecover(false)}>
                  Cancel
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    setStore(freshStore());
                    onRecover();
                    setRecover(false);
                    notify("A fresh journal is ready.");
                  }}
                >
                  Reset storage
                </button>
              </div>
            </div>
          ) : (
            <button
              className="text-button destructive"
              onClick={() => setRecover(true)}
            >
              Reset unreadable storage
            </button>
          )}
        </section>
      )}

      {account && (
        <div className="profile-account">
          <button
            className="profile-sign-out"
            disabled={signingOut || savingProfile}
            onClick={() => void signOut()}
          >
            <LogOut size={17} aria-hidden="true" />{" "}
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
          {accountError && (
            <p className="form-error" role="alert">
              {accountError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
