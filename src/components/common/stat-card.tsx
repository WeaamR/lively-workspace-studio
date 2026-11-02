import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONE = {
  navy: "bg-primary-soft text-primary",
  violet: "bg-violet-soft text-violet",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
} as const;

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "navy",
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  hint?: string;
  tone?: keyof typeof TONE;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="num text-3xl font-semibold text-foreground">{value}</div>
        </div>
        <div className={cn("flex size-10 items-center justify-center rounded-xl [&_svg]:size-5", TONE[tone])}>
          {icon}
        </div>
      </div>
      {hint && <div className="mt-3 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
