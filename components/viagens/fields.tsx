/** Small shared form bits so the trip and item sheets look identical. */

export const inputCls =
  "mt-1 w-full rounded-2xl bg-canvas-soft/40 px-4 py-3 text-base text-ink outline-none ring-2 ring-transparent transition focus:bg-card-bg focus:ring-accent";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className ?? ""}`}>
      <span className="block text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export function SheetActions({
  onCancel,
  submitLabel,
  disabled,
}: {
  onCancel: () => void;
  submitLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="flex-1 rounded-full bg-elevated px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </div>
  );
}

export function DeleteRow({
  label,
  confirming,
  setConfirming,
  onConfirm,
}: {
  label: string;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return confirming ? (
    <div className="flex gap-2 pt-1">
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-2.5 text-sm font-medium text-ink"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="flex-1 rounded-full bg-danger px-4 py-2.5 text-sm font-medium text-white"
      >
        Apagar mesmo
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="w-full rounded-full px-4 py-2.5 text-sm font-medium text-danger"
    >
      {label}
    </button>
  );
}

/**
 * Date/time input that behaves on iOS Safari: the native control there has
 * its own intrinsic width and collapses to almost nothing when empty, so it
 * overflowed its grid cell. Forced to a block of fixed height, left-aligned,
 * with a hint shown while empty (iOS shows no placeholder for these).
 */
export function DateTimeInput({
  type,
  value,
  onChange,
  min,
  max,
  hint,
}: {
  type: "date" | "time";
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  hint: string;
}) {
  return (
    <div className="relative mt-1">
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className={`peer block h-12 w-full min-w-0 appearance-none rounded-2xl bg-canvas-soft/40 px-4 text-left text-base outline-none ring-2 ring-transparent transition focus:bg-card-bg focus:ring-accent [&::-webkit-date-and-time-value]:text-left ${
          // Empty: hide the browser's own "mm/dd/yyyy" so only our hint shows.
          value ? "text-ink" : "text-transparent focus:text-ink"
        }`}
      />
      {!value && (
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-muted/70 peer-focus:hidden">
          {hint}
        </span>
      )}
    </div>
  );
}
