import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-gradient-to-r from-[#E8572A] to-[#F4A261] text-white shadow hover:opacity-90 border-0": variant === "default",
            "bg-red-500 text-white shadow-sm hover:bg-red-500/90": variant === "destructive",
            "border border-[#333333] bg-transparent text-white shadow-sm hover:bg-[#333333]": variant === "outline",
            "bg-[#333333] text-white shadow-sm hover:bg-[#444444]": variant === "secondary",
            "hover:bg-[#333333] hover:text-white text-[#AAAAAA]": variant === "ghost",
            "text-white underline-offset-4 hover:underline": variant === "link",
            "h-10 px-5 py-2": size === "default",
            "h-8 px-4 text-xs": size === "sm",
            "h-12 px-8 text-sm": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
