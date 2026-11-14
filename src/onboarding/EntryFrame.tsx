import type { ReactNode } from "react";
import { Moon } from "lucide-react";

export function EntryFrame({
  headerAction,
  children,
}: {
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="entry-shell">
      <header className="entry-header">
        <span className="entry-brand">
          <Moon size={19} aria-hidden="true" /> NOCTIS
        </span>
        {headerAction}
      </header>
      {children}
    </div>
  );
}
