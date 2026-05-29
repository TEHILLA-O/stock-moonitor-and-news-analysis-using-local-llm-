export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-24 rounded-2xl border border-white/10 bg-white/[0.04]" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-40 rounded-2xl border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
    </div>
  );
}
