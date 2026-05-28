import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
        secondary: "border-white/10 bg-white/5 text-slate-400",
        success: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        danger: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300",
        info: "border-violet-500/30 bg-violet-500/10 text-violet-300",
        outline: "border-white/15 text-slate-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
