import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ChevronLeft, FolderX } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { DemoBadge } from "@/components/common/status-badges";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectBundle } from "@/data/selectors";
import { useActions } from "@/data/store";
import { formatDate } from "@/lib/format";
import { PROJECT_STATUS_LABEL } from "@/lib/labels";
import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "تفاصيل المشروع — SCOPE" },
      { name: "description", content: "تحليل الطلب ونطاق العمل والتغييرات وسجل المشروع." },
      { property: "og:title", content: "تفاصيل المشروع — SCOPE" },
      { property: "og:description", content: "تحليل الطلب ونطاق العمل والتغييرات وسجل المشروع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectLayout,
});

const TABS = [
  { to: "/projects/$projectId", label: "نظرة عامة", exact: true },
  { to: "/projects/$projectId/analysis", label: "تحليل الطلب" },
  { to: "/projects/$projectId/scope", label: "نطاق العمل" },
  { to: "/projects/$projectId/changes", label: "كشف التغييرات" },
  { to: "/projects/$projectId/history", label: "السجل" },
] as const;

const STATUS_DOT: Record<ProjectStatus, string> = {
  pending: "bg-info",
  needs_clarification: "bg-warning",
  in_progress: "bg-violet",
  completed: "bg-success",
};

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const { project, service } = useProjectBundle(projectId);
  const { updateProject } = useActions();

  if (!project) {
    return (
      <EmptyState
        icon={<FolderX />}
        title="المشروع غير موجود"
        description="ربما تم حذفه، أو أن الرابط غير صحيح."
        action={
          <Button asChild variant="outline">
            <Link to="/projects">العودة إلى المشاريع</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link to="/projects" className="hover:text-foreground">
            المشاريع
          </Link>
          <ChevronLeft className="size-3.5" />
          <span className="truncate text-foreground">{project.title}</span>
        </nav>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
              {project.is_demo && <DemoBadge />}
            </div>
            <p className="text-sm text-muted-foreground">
              {project.client_name} · {service?.name ?? "بدون خدمة محددة"} · أُنشئ في{" "}
              <span className="num">{formatDate(project.created_at)}</span>
            </p>
          </div>
          <Select value={project.status} onValueChange={(v) => updateProject(project.id, { status: v as ProjectStatus })}>
            <SelectTrigger className="w-full md:w-52" aria-label="حالة المشروع">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", STATUS_DOT[s])} />
                    {PROJECT_STATUS_LABEL[s]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="-mx-4 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
          <nav className="flex min-w-max gap-1">
            {TABS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                params={{ projectId }}
                activeOptions={{ exact: "exact" in t ? t.exact : false }}
                className="-mb-px border-b-2 border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-primary data-[status=active]:font-medium data-[status=active]:text-foreground"
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
