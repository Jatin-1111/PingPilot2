import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-xl bg-tint/[0.05] before:absolute before:inset-0 before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-tint/[0.06] before:to-transparent",
        className
      )}
      {...props} />)
  );
}

export { Skeleton }
