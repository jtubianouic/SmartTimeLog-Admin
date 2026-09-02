import { Inbox } from "lucide-react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-14 text-center">
      <Inbox className="mx-auto size-6 text-slate-600" />
      <p className="mt-4 text-sm text-slate-400">{message}</p>
    </div>
  );
}