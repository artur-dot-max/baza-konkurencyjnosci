"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLProgressElement,
  React.ComponentPropsWithoutRef<"progress">
>(({ className, value = 0, max = 100, ...props }, ref) => (
  <progress
    ref={ref}
    className={cn(
      "h-4 w-full overflow-hidden rounded-full accent-primary",
      className
    )}
    value={value ?? 0}
    max={max}
    {...props}
  />
))
Progress.displayName = "Progress"

export { Progress }
