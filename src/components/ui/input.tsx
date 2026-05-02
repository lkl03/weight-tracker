import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
