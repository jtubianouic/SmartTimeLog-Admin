export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-32 rounded bg-emerald-300/15" />
      <div className="mt-4 h-9 w-52 rounded bg-white/10" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div className="h-36 rounded-lg border border-white/8 bg-white/4" key={index} />)}
      </div>
      <div className="mt-6 h-72 rounded-lg border border-white/8 bg-white/4" />
    </div>
  );
}