import { FlaskConical, Info, PlugZap } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONES = {
  demo: { cls: "border-violet/25 bg-violet-soft text-foreground", icon: FlaskConical, iconCls: "text-violet" },
  offline: { cls: "border-warning/30 bg-warning-soft text-foreground", icon: PlugZap, iconCls: "text-warning" },
  info: { cls: "border-info/25 bg-info-soft text-foreground", icon: Info, iconCls: "text-info" },
} as const;

export function Notice({
  tone,
  title,
  children,
  action,
  className,
}: {
  tone: keyof typeof TONES;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center", t.cls, className)}>
      <div className="flex flex-1 items-start gap-3">
        <Icon className={cn("mt-0.5 size-4 shrink-0", t.iconCls)} />
        <div className="space-y-0.5">
          <div className="text-sm font-medium">{title}</div>
          {children && <div className="text-xs leading-5 text-muted-foreground">{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
