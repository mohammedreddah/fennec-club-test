export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-dune-600">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-dune-100 border-t-fennec-500"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
