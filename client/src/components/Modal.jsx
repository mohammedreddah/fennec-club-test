import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${width} max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-card`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-dune-600 hover:bg-dune-50 hover:text-ink"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
