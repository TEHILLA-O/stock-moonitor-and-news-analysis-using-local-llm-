import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg", className)} />;
}

export function ShimmerCard() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <Shimmer className="h-6 w-1/3" />
      <Shimmer className="h-32 w-full" />
      <div className="grid grid-cols-3 gap-3">
        <Shimmer className="h-20" />
        <Shimmer className="h-20" />
        <Shimmer className="h-20" />
      </div>
    </div>
  );
}
