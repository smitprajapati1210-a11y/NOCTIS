import { useLayoutEffect, useRef, type RefObject } from "react";
import type { Tab } from "./BottomNav";

export default function ScrollSky({
  scrollArea,
  page,
}: {
  scrollArea: RefObject<HTMLElement | null>;
  page: Tab;
}) {
  const distant = useRef<HTMLSpanElement>(null);
  const near = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!scrollArea.current) return;
    const scroller = scrollArea.current;
    const farStars = distant.current!;
    const nearStars = near.current!;
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastTop = Math.max(0, scroller.scrollTop);
    let lastTime = 0;
    let drift = 0;

    function paint(top: number) {
      // Ease the accumulated distance toward a bound on unusually long pages.
      const travel = 1 - Math.exp(-top / 1450);
      farStars.style.transform = `translate3d(0, ${-travel * 99}px, 0)`;
      nearStars.style.transform = `translate3d(0, ${-travel * 215 - drift}px, 0)`;
    }

    function update(time: number) {
      frame = 0;
      const top = Math.max(0, scroller.scrollTop);
      const elapsed = lastTime ? Math.max(1, time - lastTime) : 16.7;
      const delta = top - lastTop;
      lastTop = top;
      lastTime = time;
      const quickScroll = Math.max(0, Math.abs(delta) - elapsed * 0.45);
      drift = Math.max(
        -24,
        Math.min(
          24,
          drift * Math.exp(-elapsed / 95) +
            Math.sign(delta) * quickScroll * 0.28,
        ),
      );
      if (Math.abs(drift) < 0.25) drift = 0;
      paint(top);
      if (drift) queueFrame();
      else lastTime = 0;
    }

    function queueFrame() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    function reset() {
      scroller.removeEventListener("scroll", queueFrame);
      window.cancelAnimationFrame(frame);
      frame = lastTime = drift = 0;
      lastTop = Math.max(0, scroller.scrollTop);
      paint(preference?.matches ? 0 : lastTop);
      if (!preference?.matches)
        scroller.addEventListener("scroll", queueFrame, { passive: true });
    }

    reset();
    preference?.addEventListener?.("change", reset);
    return () => {
      scroller.removeEventListener("scroll", queueFrame);
      preference?.removeEventListener?.("change", reset);
      window.cancelAnimationFrame(frame);
    };
  }, [page, scrollArea]);

  return (
    <div className="scroll-sky" aria-hidden="true">
      <span className="scroll-sky-distant" ref={distant} />
      <span className="scroll-sky-near" ref={near} />
    </div>
  );
}
