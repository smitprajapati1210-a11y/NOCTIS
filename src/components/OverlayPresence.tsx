import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { reducedMotion } from "../motion";

const ClosingContext = createContext(false);
export const useOverlayClosing = () => useContext(ClosingContext);

export default function OverlayPresence({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  const [present, setPresent] = useState(show);
  const previous = useRef(children);
  const wasShown = useRef(false);
  const generation = useRef(0);
  if (show && !wasShown.current) generation.current++;
  wasShown.current = show;
  if (show) previous.current = children;
  useEffect(() => {
    if (show) {
      setPresent(true);
      return;
    }
    const timer = setTimeout(
      () => setPresent(false),
      reducedMotion() ? 0 : 160,
    );
    return () => clearTimeout(timer);
  }, [show]);
  if (!show && !present) return null;
  return (
    <ClosingContext.Provider value={!show}>
      <div
        key={generation.current}
        className="overlay-presence"
        data-closing={!show}
        aria-hidden={!show || undefined}
        inert={!show}
      >
        {show ? children : previous.current}
      </div>
    </ClosingContext.Provider>
  );
}
