import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-[10px] border-0 bg-[#111111] px-3 py-2 text-[13px] text-white shadow-inner placeholder:text-[#888888] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E8572A] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
