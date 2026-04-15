import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface BadgeProps extends React.ComponentProps<"div"> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2",
        {
          "bg-gradient-to-r from-[#E8572A] to-[#F4A261] text-white border-0": variant === "default",
          "border border-[#555555] text-[#AAAAAA] bg-transparent": variant === "secondary" || variant === "outline",
          "border border-red-400/50 text-red-400 bg-red-400/10": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
