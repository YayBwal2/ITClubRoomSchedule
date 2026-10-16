import React from "react";
import { cn } from "@/lib/utils";
import { BookingStatus } from "@/types/database";

interface BadgeProps {
  status: BookingStatus | "active" | "maintenance";
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
    cancelled: "bg-slate-50 text-slate-600 border-slate-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    maintenance: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
        styles[status] || "bg-slate-100 text-slate-800 border-slate-200",
        className
      )}
    >
      {status}
    </span>
  );
}
