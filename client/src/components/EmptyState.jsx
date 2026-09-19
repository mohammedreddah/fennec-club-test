import { Inbox } from 'lucide-react';

export default function EmptyState({ title, description, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-dune-100 py-12 px-6 text-center">
      <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-fennec-50 text-fennec-500">
        <Icon size={20} />
      </div>
      <p className="font-display text-lg text-ink">{title}</p>
      {description && <p className="text-sm text-dune-600 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
