import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  FileText,
  GitCompareArrows,
  Inbox,
  MessageSquare,
  Send,
  SendHorizontal,
} from "lucide-react";

import type { ActivityEvent, ActivityType } from "@/lib/activity";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICON: Record<ActivityType, { icon: typeof Inbox; tone: string }> = {
  request: { icon: Inbox, tone: "bg-info-soft text-info" },
  client_message: { icon: MessageSquare, tone: "bg-muted text-muted-foreground" },
  freelancer_message: { icon: SendHorizontal, tone: "bg-primary-soft text-primary" },
  change_request: { icon: GitCompareArrows, tone: "bg-violet-soft text-violet" },
  scope_created: { icon: FileText, tone: "bg-muted text-muted-foreground" },
  scope_sent: { icon: Send, tone: "bg-warning-soft text-warning" },
  scope_approved: { icon: CheckCircle2, tone: "bg-success-soft text-success" },
};

export function ActivityList({
  events,
  showProject = true,
  showDetail = false,
}: {
  events: ActivityEvent[];
  showProject?: boolean;
  showDetail?: boolean;
}) {
  return (
    <ol className="relative space-y-0">
      {events.map((e, idx) => {
        const { icon: Icon, tone } = ICON[e.type];
        return (
          <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
            {idx < events.length - 1 && (
              <span className="absolute top-9 bottom-0 start-4 w-px -translate-x-1/2 bg-border rtl:translate-x-1/2" />
            )}
            <div className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full", tone)}>
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-medium text-foreground">{e.title}</span>
                <span className="num text-xs text-muted-foreground">{formatDateTime(e.at)}</span>
              </div>
              {showProject && (
                <Link
                  to="/projects/$projectId/history"
                  params={{ projectId: e.project_id }}
                  className="block truncate text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  {e.project_title}
                </Link>
              )}
              {showDetail && e.detail && (
                <p className="mt-1.5 line-clamp-3 rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground/85">
                  {e.detail}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
