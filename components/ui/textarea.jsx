import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full rounded-xl bg-tint/[0.035] px-3.5 py-3 text-base text-foreground shadow-[inset_0_1px_2px_color-mix(in_oklch,var(--shadow-ink)_25%,transparent)] ring-1 ring-tint/10 outline-none transition-[box-shadow,background-color] duration-300 ease-fluid placeholder:text-muted-foreground/70 hover:ring-tint/20 focus-visible:bg-tint/[0.05] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/60 md:text-sm",
        className
      )}
      {...props} />
  );
}

export { Textarea }
