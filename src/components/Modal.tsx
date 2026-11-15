import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useOverlayClosing } from "./OverlayPresence";

export default function Modal({
  title,
  children,
  onClose,
  wide = false,
  className,
  fullScreen = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
  fullScreen?: boolean;
}) {
  const closing = useOverlayClosing();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (closing) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const candidates = panel.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]',
        );
        const nodes = Array.from(candidates ?? []).filter(
          (node) =>
            !node.closest(
              "[hidden], [inert], details:not([open]) > :not(summary)",
            ),
        );
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === panel.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === panel.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [closing]);
  return (
    <div
      className={fullScreen ? "modal-backdrop full-screen" : "modal-backdrop"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={["sheet", wide && "wide", className]
          .filter(Boolean)
          .join(" ")}
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        {!fullScreen && <div className="sheet-handle" />}
        <header className="sheet-header">
          {fullScreen && (
            <button
              className="icon-button"
              onClick={onClose}
              aria-label="Back to app"
            >
              <ArrowLeft size={21} aria-hidden="true" />
            </button>
          )}
          <h2>{title}</h2>
          {!fullScreen && (
            <button
              className="icon-button"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={21} aria-hidden="true" />
            </button>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}
