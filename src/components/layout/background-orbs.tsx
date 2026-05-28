export function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="orb orb-cyan -left-32 top-20 h-[420px] w-[420px] opacity-60" />
      <div
        className="orb orb-violet right-0 top-1/3 h-[500px] w-[500px] opacity-50"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="orb orb-magenta bottom-0 left-1/3 h-[380px] w-[380px] opacity-40"
        style={{ animationDelay: "-14s" }}
      />
    </div>
  );
}
