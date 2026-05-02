"use client";

import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-9 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400",
        "appearance-none cursor-pointer",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";
