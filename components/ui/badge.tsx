import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        neutral: "bg-zinc-100 text-zinc-800 ring-zinc-200 dark:bg-[#252525] dark:text-[#e5e7eb] dark:ring-[#3a3a3a]",
        success: "bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-500/18 dark:text-emerald-100 dark:ring-emerald-400/30",
        warning: "bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-500/18 dark:text-amber-100 dark:ring-amber-400/30",
        danger: "bg-rose-100 text-rose-800 ring-rose-300 dark:bg-rose-500/18 dark:text-rose-100 dark:ring-rose-400/30",
        info: "bg-sky-100 text-sky-800 ring-sky-300 dark:bg-sky-500/18 dark:text-sky-100 dark:ring-sky-400/30",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
