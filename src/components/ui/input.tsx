import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white placeholder:text-muted outline-none transition-colors focus:border-primary",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
