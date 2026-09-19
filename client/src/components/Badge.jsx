const VARIANTS = {
  present: 'bg-present/10 text-present',
  absent: 'bg-absent/10 text-absent',
  received: 'bg-present/10 text-present',
  missing: 'bg-pending/10 text-pending',
  active: 'bg-present/10 text-present',
  inactive: 'bg-dune-100 text-dune-600',
};

// `children` is provided by the caller (already translated), this component only styles it.
export default function Badge({ variant = 'inactive', children }) {
  return <span className={`badge ${VARIANTS[variant] || VARIANTS.inactive}`}>{children}</span>;
}
