import type { ReactNode } from "react";

interface ChipOptionProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  hint?: string;
}

export function ChipOption({ label, selected, onSelect, hint }: ChipOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-selected={selected}
      onClick={onSelect}
      title={hint}
      className="mda-chip mda-focus px-4 py-2.5 text-sm font-medium text-ink cursor-pointer"
    >
      {label}
    </button>
  );
}

export function ChipGroup({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: Array<{ value: string; label: string; hint?: string }>;
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-widest text-muted mb-2">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <ChipOption
            key={opt.value}
            label={opt.label}
            hint={opt.hint}
            selected={value === opt.value}
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
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="mda-btn-primary mda-focus px-6 py-3 text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {busy ? "Picking…" : children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mda-btn-secondary mda-focus px-5 py-2.5 text-sm cursor-pointer disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export { LanguageSwitcher } from "./LanguageSwitcher";
export { ThemeSwitcher } from "./ThemeSwitcher";
