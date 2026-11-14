import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { LucideIcon } from "lucide-react";
import { reducedMotion } from "../motion";

type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  origin: number;
  width: number;
  offset: number;
  position: number;
  active: boolean;
};

const slideDuration = 310;
const settle = "cubic-bezier(.22, 1, .36, 1)";
const clamp = (value: number, max: number) => Math.max(0, Math.min(value, max));

function soften(position: number, limit: number) {
  const edge = clamp(position, limit);
  const excess = position - edge;
  return edge + (excess * 7) / (20 + Math.abs(excess));
}

function lensOutline(bend: number, rectangular: boolean) {
  const left = Math.max(0, -bend);
  const right = Math.max(0, bend);
  const shoulder = rectangular ? 1 : 22;
  const trailingInset = rectangular ? 4 : 9;
  const reach = rectangular ? 6 : 13;
  const leftShoulder = shoulder + right * (rectangular ? 4 : -5);
  const rightShoulder = 100 - shoulder - left * (rectangular ? 4 : -5);
  const leftTop = 1 + right * trailingInset - left * 4;
  const rightTop = 1 + left * trailingInset - right * 4;
  const leftEdge = 1 - left * reach + right * 2;
  const rightEdge = 99 + right * reach - left * 2;
  return `shape(from ${leftShoulder}% ${leftTop}%,
    curve to ${rightShoulder}% ${rightTop}% with 42% ${leftTop}% / 58% ${rightTop}%,
    curve to ${rightEdge}% 50% with ${rightEdge}% ${rightTop}% / ${rightEdge}% 25%,
    curve to ${rightShoulder}% ${100 - rightTop}% with ${rightEdge}% 75% / ${rightEdge}% ${100 - rightTop}%,
    curve to ${leftShoulder}% ${100 - leftTop}% with 58% ${100 - rightTop}% / 42% ${100 - leftTop}%,
    curve to ${leftEdge}% 50% with ${leftEdge}% ${100 - leftTop}% / ${leftEdge}% 75%,
    curve to ${leftShoulder}% ${leftTop}% with ${leftEdge}% 25% / ${leftEdge}% ${leftTop}%, close)`;
}

const canBend = !!globalThis.CSS?.supports("clip-path", lensOutline(0, false));

export default function GlassSelector<T extends string | number>({
  options,
  value,
  onSelect,
  label,
  navigation = false,
}: {
  options: readonly { value: T; label: string; icon?: LucideIcon }[];
  value: T;
  onSelect: (value: T) => void;
  label: string;
  navigation?: boolean;
}) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const restingOutline = lensOutline(0, !navigation);
  const initialPosition = useRef(`translateX(${index * 100}%)`);
  const cursor = useRef<HTMLSpanElement>(null);
  const lens = useRef<HTMLSpanElement>(null);
  const gleam = useRef<HTMLSpanElement>(null);
  const target = useRef(index);
  const drag = useRef<Drag | null>(null);
  const ignoreClick = useRef(false);
  const flex = useRef<Animation | undefined>(undefined);
  const shine = useRef<Animation | undefined>(undefined);

  function slideTo(index: number, from: number) {
    const track = cursor.current!;
    const glass = lens.current!;
    const light = gleam.current!;
    const distance = index - from;
    const wasDragging = track.hasAttribute("data-dragging");
    const still = reducedMotion();
    const lensStyle = getComputedStyle(glass);
    const fromShape = canBend ? lensStyle.clipPath : lensStyle.transform;
    const lightStyle = getComputedStyle(light);
    const fromLight = {
      transform: lightStyle.transform,
      opacity: lightStyle.opacity,
    };
    if (wasDragging) {
      // Resolve the last dragged position before giving control back to the transition.
      void getComputedStyle(track).transform;
      delete track.dataset.dragging;
      delete track.parentElement!.dataset.dragging;
    }
    target.current = index;
    track.style.transform = `translateX(${index * 100}%)`;
    flex.current?.cancel();
    shine.current?.cancel();
    glass.style.transform = "";
    if (canBend) glass.style.clipPath = restingOutline;
    if (still || (!distance && !wasDragging) || !glass.animate) return;

    const direction = Math.sign(distance);
    const bend = direction * Math.min(0.65 + Math.abs(distance) * 0.15, 1);
    const peak = canBend
      ? { clipPath: lensOutline(bend, !navigation) }
      : {
          transform: `translateY(-2px) scale(${1 + Math.abs(bend) * 0.14}, .965)`,
        };
    const start = canBend ? { clipPath: fromShape } : { transform: fromShape };
    const end = canBend ? { clipPath: restingOutline } : { transform: "none" };
    flex.current = glass.animate(
      [start, { ...peak, offset: 0.24, easing: settle }, end],
      { duration: slideDuration },
    );
    shine.current = light.animate(
      [
        fromLight,
        {
          transform: `translateX(${direction * 30}%)`,
          opacity: 0.82,
          offset: 0.26,
          easing: settle,
        },
        { transform: `translateX(${direction * 46}%)`, opacity: 0 },
      ],
      { duration: slideDuration },
    );
  }

  useLayoutEffect(() => {
    if (target.current === index) return;
    slideTo(index, target.current);
  }, [index]);

  function select(index: number) {
    const from = target.current;
    if (from !== index) slideTo(index, from);
    onSelect(options[index].value);
  }

  function startDrag(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    ignoreClick.current = false;
    const buttons = event.currentTarget.querySelectorAll("button");
    const selected = buttons[target.current];
    if (!selected?.contains(event.target as Node)) return;
    const first = buttons[0].getBoundingClientRect();
    if (!first.width) return;
    const position = cursor.current!.getBoundingClientRect().left - first.left;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: first.left,
      width: first.width,
      offset: event.clientX - first.left - position,
      position,
      active: false,
    };
  }

  function moveDrag(event: PointerEvent<HTMLElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    const track = cursor.current!;
    if (!gesture.active) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        drag.current = null;
        ignoreClick.current = true;
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      ignoreClick.current = true;
      gesture.active = true;
      track.dataset.dragging = "";
      event.currentTarget.dataset.dragging = "";
      flex.current?.cancel();
      shine.current?.cancel();
    }
    const position = soften(
      event.clientX - gesture.origin - gesture.offset,
      gesture.width * (options.length - 1),
    );
    const delta = position - gesture.position;
    gesture.position = position;
    track.style.transform = `translateX(${position}px)`;
    if (!reducedMotion()) {
      const bend =
        Math.sign(delta || dx) * Math.min(0.45 + Math.abs(delta) / 95, 0.85);
      if (canBend)
        lens.current!.style.clipPath = lensOutline(bend, !navigation);
      else
        lens.current!.style.transform = `translateY(-2px) scale(${1 + Math.abs(bend) * 0.09}, .98)`;
    }
  }

  function finishDrag(event: PointerEvent<HTMLElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (
      event.type === "lostpointercapture" &&
      event.target !== event.currentTarget
    )
      return;
    drag.current = null;
    if (!gesture.active) return;
    const commit = event.type === "pointerup";
    const index = commit
      ? clamp(
          Math.floor((event.clientX - gesture.origin) / gesture.width),
          options.length - 1,
        )
      : target.current;
    slideTo(index, gesture.position / gesture.width);
    if (commit) onSelect(options[index].value);
  }

  const Container = navigation ? "nav" : "div";
  return (
    <Container
      className={
        navigation
          ? "bottom-nav glass-selector"
          : "segmented glide-selector glass-selector"
      }
      role={navigation ? undefined : "group"}
      aria-label={label}
      style={{ "--glass-options": options.length } as CSSProperties}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onLostPointerCapture={finishDrag}
      onPointerLeave={() => {
        if (!drag.current?.active) drag.current = null;
      }}
      onClickCapture={(event) => {
        if (!ignoreClick.current || event.detail === 0) return;
        ignoreClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <span
        ref={cursor}
        className="glass-selector-cursor"
        aria-hidden="true"
        style={{ transform: initialPosition.current }}
      >
        <span
          ref={lens}
          className="glass-selector-lens"
          style={canBend ? { clipPath: restingOutline } : undefined}
        >
          <span className="glass-selector-surface" />
          <span ref={gleam} className="glass-selector-gleam" />
        </span>
      </span>
      {options.map(({ value: option, label, icon: Icon }, index) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            className={active ? "active" : ""}
            aria-current={navigation && active ? "page" : undefined}
            aria-pressed={navigation ? undefined : active}
            onClick={() => select(index)}
          >
            {Icon && (
              <span>
                <Icon
                  aria-hidden="true"
                  size={21}
                  strokeWidth={active ? 1.9 : 1.5}
                />
              </span>
            )}
            {navigation ? <small>{label}</small> : label}
          </button>
        );
      })}
    </Container>
  );
}
