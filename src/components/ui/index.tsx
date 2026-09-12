import type { ReactNode } from "react";

interface ChipOptionProps {
  label: string;
  emoji?: string;
  selected: boolean;
  blinking?: boolean;
  onSelect: () => void;
  hint?: string;
  colSpan?: string;
}

export function ChipOption({
  label,
  emoji,
  selected,
  blinking,
  onSelect,
  hint,
  colSpan = "",
}: ChipOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-selected={selected}
      onClick={onSelect}
      title={hint}
      className={`mda-chip mda-focus w-full py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold text-ink cursor-pointer flex items-center justify-center gap-2 text-center leading-normal ${
        blinking ? "mda-chip-blink" : ""
      } ${colSpan}`}
    >
      {emoji && <span className="text-base sm:text-lg shrink-0 select-none">{emoji}</span>}
      <span className="line-clamp-1">{label}</span>
    </button>
  );
}

export function ChipGroup({
  legend,
  options,
  value,
  blinkingValue,
  onChange,
}: {
  legend: string;
  options: Array<{ value: string; label: string; emoji?: string; hint?: string; colSpan?: string }>;
  value: string | null;
  blinkingValue?: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {options.map((opt) => (
          <ChipOption
            key={opt.value}
            label={opt.label}
            emoji={opt.emoji}
            hint={opt.hint}
            selected={value === opt.value}
            blinking={blinkingValue === opt.value}
            colSpan={opt.colSpan}
            onSelect={() => onChange(opt.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mda-card ${className}`}>{children}</div>;
}

export function TicketPerforation({ className = "" }: { className?: string }) {
  return (
    <div className={`ticket-perforation-row ${className}`} aria-hidden="true">
      {/* Left Notch: Seamless inward filleted cutout with vertical C1 entry/exit */}
      <svg
        className="ticket-notch-left-svg shrink-0"
        width="46"
        height="32"
        viewBox="0 0 46 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fill cavity and outside card border with background color */}
        <path
          d="M 11.5 0 A 3.0 3.0 0 0 0 13.19 2.70 A 14.80 14.80 0 0 1 13.19 29.30 A 3.0 3.0 0 0 0 11.5 32.0 L 0 32 L 0 0 Z"
          fill="var(--color-bg)"
        />
        {/* Draw the inward border arc with pure vertical tangents continuing the card's 3px outline */}
        <path
          d="M 11.5 0 A 3.0 3.0 0 0 0 13.19 2.70 A 14.80 14.80 0 0 1 13.19 29.30 A 3.0 3.0 0 0 0 11.5 32.0"
          stroke="var(--color-line)"
          strokeWidth="3"
          fill="none"
        />
      </svg>

      <div className="ticket-dashed-line" />

      {/* Right Notch: Seamless inward filleted cutout with vertical C1 entry/exit */}
      <svg
        className="ticket-notch-right-svg shrink-0"
        width="46"
        height="32"
        viewBox="0 0 46 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fill cavity and border width up to outer border (x=36) without clipping the drop-shadow */}
        <path
          d="M 34.5 0 A 3.0 3.0 0 0 1 32.81 2.70 A 14.80 14.80 0 0 0 32.81 29.30 A 3.0 3.0 0 0 1 34.5 32.0 L 36.0 32.0 L 36.0 0.0 Z"
          fill="var(--color-bg)"
        />
        {/* Draw the inward border arc with pure vertical tangents continuing the card's 3px outline */}
        <path
          d="M 34.5 0 A 3.0 3.0 0 0 1 32.81 2.70 A 14.80 14.80 0 0 0 32.81 29.30 A 3.0 3.0 0 0 1 34.5 32.0"
          stroke="var(--color-line)"
          strokeWidth="3"
          fill="none"
        />
      </svg>
    </div>
  );
}

export function Barcode({ className = "" }: { className?: string }) {
  // Authentic looking varied barcode bars (widths 1px to 4px)
  const pattern = [2, 1, 3, 1, 1, 4, 1, 2, 1, 3, 2, 1, 1, 2, 4, 1, 2, 1, 3, 1, 2, 3, 1, 1, 2];
  return (
    <div className={`mda-barcode ${className}`} aria-hidden="true">
      {pattern.map((w, idx) => (
        <span
          key={idx}
          className="mda-barcode-bar"
          style={{ width: `${w}px` }}
        />
      ))}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  busy = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`mda-btn-primary mda-focus px-6 py-3 text-sm sm:text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {busy ? "Picking…" : children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mda-btn-secondary mda-focus px-4 sm:px-5 py-2.5 text-xs sm:text-sm cursor-pointer disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export { LanguageSwitcher } from "./LanguageSwitcher";
export { ThemeSwitcher } from "./ThemeSwitcher";
export { WatchlistButton } from "./WatchlistButton";
export { WatchlistNav } from "./WatchlistNav";
export { MoviePoster, PosterFallback } from "./MoviePoster";
