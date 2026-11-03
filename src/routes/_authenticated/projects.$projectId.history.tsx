import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { ActivityList } from "@/components/common/activity-list";
import { CLASSIFICATION_VARIANT, ScopeStatusBadge } from "@/components/common/status-badges";
import { Badge } from "@/components/ui/badge";
import { useProjectBundle } from "@/data/selectors";
import { useAppData } from "@/data/store";
import { buildActivity } from "@/lib/activity";
import { formatDate, formatDateTime } from "@/lib/format";
import { CLASSIFICATION_LABEL } from "@/lib/labels";
import type { ChangeClassification } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/projects/$projectId/history")({
  head: () => ({
    meta: [
      { title: "سجل المشروع — SCOPE" },
      { name: "description", content: "الطلب الأصلي والرسائل ونسخ النطاق المعتمدة والتغييرات وتواريخ الموافقة." },
      { property: "og:title", content: "سجل المشروع — SCOPE" },
      { property: "og:description", content: "الطلب الأصلي والرسائل ونسخ النطاق المعتمدة والتغييرات وتواريخ الموافقة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectHistory,
});

function ProjectHistory() {
  const { projectId } = Route.useParams();
  const data = useAppData();
  const { project, versions, messages } = useProjectBundle(projectId);
  if (!project) return null;

  const events = buildActivity(data, projectId);
  const approvedVersions = versions.filter((v) => v.approved_at);
  const changes = messages.filter((m) => m.kind === "change_request");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="surface-card p-5 lg:col-span-2">
        <h2 className="mb-5 text-base font-semibold">الخط الزمني</h2>
        <ActivityList events={events} showProject={false} showDetail />
      </section>

      <aside className="space-y-6">
        <section className="surface-card p-5">
          <h2 className="mb-3 text-base font-semibold">نسخ النطاق المعتمدة</h2>
          {approvedVersions.length === 0 ? (
            <p className="text-sm text-muted-foreground">لم تُعتمد أي نسخة بعد.</p>
          ) : (
            <ul className="space-y-3">
              {approvedVersions.map((v) => (
                <li key={v.id} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">النسخة {v.version_number}</span>
                      <ScopeStatusBadge status={v.status} />
                    </div>
                    <div className="num text-xs text-muted-foreground">اعتُمدت في {formatDate(v.approved_at)}</div>
                    {v.notes && <p className="mt-1 text-xs leading-5 text-muted-foreground">{v.notes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/projects/$projectId/scope"
            params={{ projectId }}
            className="mt-4 inline-block text-xs text-primary hover:underline"
          >
            عرض كل النسخ
          </Link>
        </section>

        <section className="surface-card p-5">
          <h2 className="mb-3 text-base font-semibold">تغييرات النطاق</h2>
          {changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد طلبات تغيير.</p>
          ) : (
            <ul className="space-y-3">
              {changes.map((m) => (
                <li key={m.id} className="space-y-1.5">
                  <div className="num text-xs text-muted-foreground">{formatDateTime(m.created_at)}</div>
                  <p className="line-clamp-2 text-sm">{m.content}</p>
                  <div className="flex flex-wrap gap-1">
                    {m.change_analysis ? (
                      (["within_scope", "additional_work", "needs_clarification"] as ChangeClassification[]).map((c) => {
                        const n = m.change_analysis!.items.filter((i) => i.classification === c).length;
                        return n ? (
                          <Badge key={c} variant={CLASSIFICATION_VARIANT[c]}>
                            {CLASSIFICATION_LABEL[c]} · <span className="num">{n}</span>
                          </Badge>
                        ) : null;
                      })
                    ) : (
                      <Badge variant="muted">لم يُقارن</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
