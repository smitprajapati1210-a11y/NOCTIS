import React from "react";
import ReactDOM from "react-dom/client";
import AccountGate from "./onboarding/AccountGate";
import "@fontsource-variable/manrope";
import "@fontsource-variable/outfit";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./styles.css";
import "./refinements.css";
import "./editorial.css";
import "./components/SleepChart.css";
import "./components/AppHeader.css";
import "./components/WindDown.css";
import "./components/FocusLayout.css";
import "./onboarding/Entry.css";

class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="fatal">
        <h1>A little pause.</h1>
        <p>
          NOCTIS couldn’t open this view. Your saved journal is still in this
          browser.
        </p>
        <button onClick={() => location.reload()}>Reopen NOCTIS</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AccountGate />
    </ErrorBoundary>
  </React.StrictMode>,
);

if (
  import.meta.env.PROD &&
  "serviceWorker" in navigator &&
  window.isSecureContext
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Journal remains usable without offline caching. */
    });
  });
}
