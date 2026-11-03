import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, GitCompareArrows, Lock } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { ProjectStatusBadge } from "@/components/common/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/data/store";
import { formatDate } from "@/lib/format";
import { latestApproved } from "@/lib/scope";

export const Route = createFileRoute("/_authenticated/changes")({
  head: () => ({
    meta: [
      { title: "كشف التغييرات — SCOPE" },
      { name: "description", content: "اختر مشروعًا لمقارنة رسائل العميل الجديدة بنطاق العمل المعتمد." },
      { property: "og:title", content: "كشف التغييرات — SCOPE" },
      { property: "og:description", content: "اختر مشروعًا لمقارنة رسائل العميل الجديدة بنطاق العمل المعتمد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChangesIndex,
});

function ChangesIndex() {
  const { projects, scopeVersions, messages } = useAppData();
  const rows = projects.map((p) => {
    const approved = latestApproved(scopeVersions, p.id);
    const changes = messages.filter((m) => m.project_id === p.id && m.kind === "change_request");
    return { p, approved, total: changes.length, pending: changes.filter((m) => !m.change_analysis).length };
  });
  const ready = rows.filter((r) => r.approved);
  const locked = rows.filter((r) => !r.approved);

  return (
    <div className="space-y-6">
      <PageHeader
        title="كشف التغييرات"
        description="اختر مشروعًا له نطاق معتمد، ثم الصق رسالة العميل الجديدة لمعرفة ما يقع ضمن الاتفاق وما يُعدّ عملًا إضافيًا."
      />

      {ready.length === 0 ? (
        <EmptyState icon={<GitCompareArrows />} title="لا توجد مشاريع بنطاق معتمد" description="اعتمد نطاق عمل لأحد المشاريع أولًا." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ready.map(({ p, approved, total, pending }) => (
            <Link
              key={p.id}
              to="/projects/$projectId/changes"
              params={{ projectId: p.id }}
              className="surface-card group flex flex-col p-5 transition-shadow hover:shadow-raised"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <ProjectStatusBadge status={p.status} />
                <ArrowLeft className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <h3 className="text-sm font-semibold">{p.title}</h3>
              <p className="text-xs text-muted-foreground">{p.client_name}</p>
              <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                <Badge variant="success">
                  النسخة <span className="num">{approved!.version_number}</span> · {formatDate(approved!.approved_at)}
                </Badge>
                <Badge variant="navy">
                  <span className="num">{total}</span> طلب تغيير
                </Badge>
                {pending > 0 && (
                  <Badge variant="warning">
                    <span className="num">{pending}</span> لم يُقارن
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {locked.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">مشاريع بلا نطاق معتمد</h2>
          <ul className="surface-card divide-y">
            {locked.map(({ p }) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <Lock className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.client_name}</div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/projects/$projectId/scope" params={{ projectId: p.id }}>
                    إعداد النطاق
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
