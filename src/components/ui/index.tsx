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
      className={`mda-chip mda-focus w-full py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold text-ink cursor-pointer flex items-center justify-center gap-2 text-center transition-all leading-normal ${
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
      <legend className="text-xs font-bold uppercase tracking-widest text-muted mb-2.5">{legend}</legend>
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
      <div className="ticket-notch-left" />
      <div className="ticket-dashed-line" />
      <div className="ticket-notch-right" />
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
