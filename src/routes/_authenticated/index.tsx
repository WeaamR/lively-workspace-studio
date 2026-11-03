import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CircleHelp, FolderKanban, Hourglass, Inbox, Plus } from "lucide-react";

import { ActivityList } from "@/components/common/activity-list";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { DemoBadge, ProjectStatusBadge } from "@/components/common/status-badges";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/data/store";
import { buildActivity } from "@/lib/activity";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — SCOPE" },
      { name: "description", content: "نظرة عامة على مشاريعك وطلبات العملاء والنطاقات التي تحتاج توضيحًا." },
      { property: "og:title", content: "لوحة التحكم — SCOPE" },
      { property: "og:description", content: "نظرة عامة على مشاريعك وطلبات العملاء والنطاقات التي تحتاج توضيحًا." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useAppData();
  const { projects, services, profile } = data;
  const count = (s: string) => projects.filter((p) => p.status === s).length;
  const recent = [...projects].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 6);
  const activity = buildActivity(data).slice(0, 7);
  const serviceName = (id: string | null) => services.find((s) => s.id === id)?.name ?? "بدون خدمة";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="لوحة التحكم"
        title={`مرحبًا، ${profile.full_name.split(" ")[0]}`}
        description="هذه نظرة سريعة على مشاريعك وما يحتاج انتباهك اليوم."
        actions={
          <Button asChild>
            <Link to="/requests/new">
              <Plus />
              تحليل طلب جديد
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي المشاريع" value={projects.length} icon={<FolderKanban />} tone="navy" />
        <StatCard
          label="طلبات بانتظار المراجعة"
          value={count("pending")}
          icon={<Inbox />}
          tone="info"
          hint="طلبات لم يكتمل تحليلها بعد"
        />
        <StatCard label="مشاريع قيد التنفيذ" value={count("in_progress")} icon={<Hourglass />} tone="violet" />
        <StatCard
          label="تحتاج توضيح النطاق"
          value={count("needs_clarification")}
          icon={<CircleHelp />}
          tone="warning"
          hint="بانتظار إجابات العميل"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="surface-card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">أحدث المشاريع</h2>
              <DemoBadge />
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to="/projects">
                كل المشاريع
                <ArrowLeft />
              </Link>
            </Button>
          </div>
          <ul className="divide-y">
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{p.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.client_name} · {serviceName(p.service_id)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProjectStatusBadge status={p.status} />
                    <span className="num w-28 text-end text-xs text-muted-foreground">{formatDate(p.updated_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-base font-semibold">آخر النشاطات</h2>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to="/history">
                السجل
                <ArrowLeft />
              </Link>
            </Button>
          </div>
          <div className="p-5">
            <ActivityList events={activity} />
          </div>
        </section>
      </div>
    </div>
  );
}
