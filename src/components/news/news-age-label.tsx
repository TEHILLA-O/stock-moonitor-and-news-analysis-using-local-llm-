import { formatNewsAge } from "@/lib/news/age";
import { cn } from "@/lib/utils";

type NewsAgeLabelProps = {
  publishedAt: string;
  className?: string;
};

/** Small pill showing how long ago the article was published. */
export function NewsAgeLabel({ publishedAt, className }: NewsAgeLabelProps) {
  const age = formatNewsAge(publishedAt);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium leading-none text-slate-400",
        className
      )}
      title={new Date(publishedAt).toLocaleString()}
    >
      {age}
    </span>
  );
}
