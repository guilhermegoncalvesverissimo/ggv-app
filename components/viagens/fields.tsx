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
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
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
