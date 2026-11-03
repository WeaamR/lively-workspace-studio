import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileSearch, FileText, GitCompareArrows, Paperclip } from "lucide-react";
import type { ReactNode } from "react";

import { ScopeStatusBadge, SourceBadge } from "@/components/common/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectBundle } from "@/data/selectors";
import { formatDate, formatFileSize, formatMoney } from "@/lib/format";
import { PRICING_MODEL_LABEL } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/projects/$projectId/")({
  component: ProjectOverview,
});

function ProjectOverview() {
  const { projectId } = Route.useParams();
  const { project, service, versions, approved, latest, messages, profile } = useProjectBundle(projectId);
  if (!project) return null;
  const changeRequests = messages.filter((m) => m.kind === "change_request");
  const a = project.analysis;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="surface-card p-5">
          <h2 className="mb-3 text-base font-semibold">رسالة العميل الأصلية</h2>
          <blockquote className="whitespace-pre-line rounded-lg border-s-4 border-primary/30 bg-muted/50 px-4 py-3 text-sm leading-7 text-foreground">
            {project.original_request}
          </blockquote>
          {project.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">المرفقات</div>
              <ul className="flex flex-wrap gap-2">
                {project.attachments.map((f) => (
                  <li key={f.name} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-xs">
                    <Paperclip className="size-3.5 text-muted-foreground" />
                    <span>{f.name}</span>
                    <span className="num text-muted-foreground">{formatFileSize(f.size)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StepCard
            icon={<FileSearch />}
            title="تحليل الطلب"
            status={a ? <SourceBadge source={a.source} /> : <Badge variant="muted">لم يُحلَّل بعد</Badge>}
            detail={a ? `${a.missing.length} معلومات ناقصة · ${a.questions.length} أسئلة` : "ابدأ بتحليل رسالة العميل."}
            to="/projects/$projectId/analysis"
            projectId={projectId}
          />
          <StepCard
            icon={<FileText />}
            title="نطاق العمل"
            status={latest ? <ScopeStatusBadge status={latest.status} /> : <Badge variant="muted">غير موجود</Badge>}
            detail={
              approved
                ? `معتمد: النسخة ${approved.version_number} في ${formatDate(approved.approved_at)}`
                : `${versions.length} نسخة · لا توجد نسخة معتمدة`
            }
            to="/projects/$projectId/scope"
            projectId={projectId}
          />
          <StepCard
            icon={<GitCompareArrows />}
            title="كشف التغييرات"
            status={<Badge variant="navy">{changeRequests.length} طلب تغيير</Badge>}
            detail={approved ? "قارن رسائل العميل الجديدة بالنطاق المعتمد." : "يتطلب نطاقًا معتمدًا أولًا."}
            to="/projects/$projectId/changes"
            projectId={projectId}
          />
        </div>
      </div>

      <aside className="surface-card h-fit p-5">
        <h2 className="mb-4 text-base font-semibold">الخدمة المرتبطة</h2>
        {service ? (
          <dl className="space-y-3 text-sm">
            <Row label="الخدمة" value={service.name} />
            <Row label="التسعير" value={`${PRICING_MODEL_LABEL[service.pricing_model]} · ${formatMoney(service.base_price, profile.currency)}`} />
            <Row label="جولات التعديل" value={`${service.revision_limit}`} />
            <Row label="مدة التسليم التقديرية" value={`${service.delivery_days} يومًا`} />
            <div className="border-t pt-3">
              <dt className="mb-1 text-xs text-muted-foreground">قواعد التسعير</dt>
              <dd className="text-sm leading-6">{service.pricing_rules}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">لم تُربط خدمة بهذا المشروع.</p>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="num text-end font-medium">{value}</dd>
    </div>
  );
}

function StepCard({
  icon,
  title,
  status,
  detail,
  to,
  projectId,
}: {
  icon: ReactNode;
  title: string;
  status: ReactNode;
  detail: string;
  to: "/projects/$projectId/analysis" | "/projects/$projectId/scope" | "/projects/$projectId/changes";
  projectId: string;
}) {
  return (
    <div className="surface-card flex flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary [&_svg]:size-4">{icon}</div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="mb-2">{status}</div>
      <p className="flex-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      <Button asChild variant="ghost" size="sm" className="mt-3 justify-between px-2">
        <Link to={to} params={{ projectId }}>
          فتح
          <ArrowLeft />
        </Link>
      </Button>
    </div>
  );
}
