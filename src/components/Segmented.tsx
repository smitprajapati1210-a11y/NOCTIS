import type { CSSProperties } from "react";

export default function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  mini = false,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  mini?: boolean;
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <div
      className={`segmented glide-selector ${mini ? "mini" : ""}`}
      role="group"
      aria-label={label}
      style={
        {
          "--segments": options.length,
          "--selected-index": index,
        } as CSSProperties
      }
    >
      <span
        className="segment-cursor"
        aria-hidden="true"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          className={option.value === value ? "active" : ""}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
