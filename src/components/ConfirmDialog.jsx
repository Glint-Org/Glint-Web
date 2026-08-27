import { useEffect, useRef } from 'react';

/**
 * Simple modal confirm — Replace/Cancel, Leave/Stay, etc.
 * Pass enterConfirms to bind Enter → confirm (Escape always cancels).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  enterConfirms = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(onConfirm);
  const cancelRef = useRef(onCancel);
  confirmRef.current = onConfirm;
  cancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelRef.current?.();
        return;
      }
      if (enterConfirms && e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        confirmRef.current?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, enterConfirms]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Dismiss"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="glint-confirm-title"
        className="relative w-full max-w-sm rounded-2xl border border-glint-border bg-glint-surface shadow-2xl p-5 space-y-4"
      >
        <div className="space-y-1.5">
          <h2 id="glint-confirm-title" className="text-base font-semibold text-glint-text">
            {title}
          </h2>
          {message ? (
            <p className="text-sm text-glint-text-secondary leading-relaxed">{message}</p>
          ) : null}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl border border-glint-border text-sm text-glint-text-secondary hover:bg-glint-surface-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus={enterConfirms}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold ${
              danger
                ? 'bg-glint-danger text-white hover:opacity-90'
                : 'glint-btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
