import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Copy,
  FileSearch,
  Loader2,
  MessageCircleQuestion,
  ScanSearch,
  Send,
  ShieldAlert,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { ListEditorStrings } from "@/components/common/list-editor";
import { Notice } from "@/components/common/notice";
import { SourceBadge } from "@/components/common/status-badges";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProjectBundle } from "@/data/selectors";
import { useActions } from "@/data/store";
import { formatDateTime } from "@/lib/format";
import { composeClarificationMessage } from "@/lib/scope";
import type { RequestAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";
import { analyzeClientRequest } from "@/services/ai";

export const Route = createFileRoute("/projects/$projectId/analysis")({
  head: () => ({
    meta: [
      { title: "تحليل الطلب — SCOPE" },
      { name: "description", content: "المعلومات المؤكدة والناقصة والغامضة والمخاطر وأسئلة التوضيح لطلب العميل." },
      { property: "og:title", content: "تحليل الطلب — SCOPE" },
      { property: "og:description", content: "المعلومات المؤكدة والناقصة والغامضة والمخاطر وأسئلة التوضيح لطلب العميل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisPage,
});

type ListKey = "confirmed" | "missing" | "ambiguous" | "risks" | "questions";

const SECTIONS: Array<{
  key: ListKey;
  title: string;
  hint: string;
  icon: typeof CheckCircle2;
  tone: string;
  bullet: string;
  placeholder: string;
}> = [
  {
    key: "confirmed",
    title: "معلومات مؤكدة",
    hint: "حقائق ذكرها العميل صراحةً في رسالته فقط.",
    icon: CheckCircle2,
    tone: "bg-success-soft text-success",
    bullet: "bg-success",
    placeholder: "أضف معلومة ذكرها العميل صراحةً…",
  },
  {
    key: "missing",
    title: "معلومات ناقصة",
    hint: "تفاصيل ضرورية لم يذكرها العميل إطلاقًا.",
    icon: CircleDashed,
    tone: "bg-info-soft text-info",
    bullet: "bg-info",
    placeholder: "أضف معلومة غير موجودة في الطلب…",
  },
  {
    key: "ambiguous",
    title: "متطلبات غامضة",
    hint: "عبارات تحتمل أكثر من تفسير.",
    icon: AlertTriangle,
    tone: "bg-warning-soft text-warning",
    bullet: "bg-warning",
    placeholder: "أضف متطلبًا يحتمل أكثر من تفسير…",
  },
  {
    key: "risks",
    title: "مخاطر محتملة",
    hint: "ما قد يسبب توسع النطاق أو تأخير التسليم.",
    icon: ShieldAlert,
    tone: "bg-destructive-soft text-destructive",
    bullet: "bg-destructive",
    placeholder: "أضف خطرًا محتملًا…",
  },
  {
    key: "questions",
    title: "أسئلة توضيح مقترحة",
    hint: "أسئلة ترسلها للعميل لسد الفجوات.",
    icon: MessageCircleQuestion,
    tone: "bg-violet-soft text-violet",
    bullet: "bg-violet",
    placeholder: "أضف سؤالًا للعميل…",
  },
];

const EMPTY: Omit<RequestAnalysis, "updated_at"> = {
  confirmed: [],
  missing: [],
  ambiguous: [],
  risks: [],
  questions: [],
  client_message: "",
  source: "manual",
};

function AnalysisPage() {
  const { projectId } = Route.useParams();
  const { project, service, profile } = useProjectBundle(projectId);
  const { saveAnalysis, addMessage, updateProject } = useActions();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);

  if (!project) return null;
  const analysis = project.analysis;

  const runAnalysis = async () => {
    setRunning(true);
    const res = await analyzeClientRequest({
      projectId: project.id,
      title: project.title,
      clientMessage: project.original_request,
      service,
      attachments: project.attachments,
    });
    setRunning(false);
    if (res.status === "ok") {
      saveAnalysis(project.id, { ...res.data, source: "ai" });
      toast.success("اكتمل التحليل");
    } else {
      setServiceMessage(res.message);
    }
  };

  const update = (patch: Partial<RequestAnalysis>) => {
    const base = analysis ?? { ...EMPTY, updated_at: "" };
    const { updated_at: _u, ...rest } = { ...base, ...patch };
    saveAnalysis(project.id, rest);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم نسخ الرسالة");
    } catch {
      toast.error("تعذّر النسخ، انسخ النص يدويًا.");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <aside className="space-y-4 lg:col-span-2">
        <div className="surface-card p-5 lg:sticky lg:top-20">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">رسالة العميل</h2>
            <span className="num text-xs text-muted-foreground">{formatDateTime(project.created_at)}</span>
          </div>
          <blockquote className="max-h-[50vh] overflow-y-auto whitespace-pre-line rounded-lg border-s-4 border-primary/30 bg-muted/50 px-4 py-3 text-sm leading-7">
            {project.original_request}
          </blockquote>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            قاعدة التحليل: لا تُضِف إلى «المعلومات المؤكدة» إلا ما ورد في هذه الرسالة نصًا. كل ما عدا ذلك معلومة ناقصة أو
            افتراض يحتاج تأكيدًا.
          </p>
        </div>
      </aside>

      <div className="space-y-5 lg:col-span-3">
        {!analysis ? (
          <>
            {serviceMessage && (
              <Notice
                tone="offline"
                title="التحليل الذكي غير متاح حاليًا"
                action={
                  <Button size="sm" variant="outline" onClick={() => saveAnalysis(project.id, EMPTY)}>
                    <Wand2 />
                    بدء التحليل اليدوي
                  </Button>
                }
              >
                {serviceMessage}
              </Notice>
            )}
            <EmptyState
              icon={<FileSearch />}
              title="لم يُحلَّل هذا الطلب بعد"
              description="حلّل رسالة العميل لاستخراج المعلومات المؤكدة والناقصة والغامضة والمخاطر وأسئلة التوضيح."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={runAnalysis} disabled={running}>
                    {running ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    تحليل الطلب
                  </Button>
                  <Button variant="outline" onClick={() => saveAnalysis(project.id, EMPTY)}>
                    <ScanSearch />
                    تحليل يدوي
                  </Button>
                </div>
              }
            />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SourceBadge source={analysis.source} />
                <span className="num text-xs text-muted-foreground">آخر تحديث {formatDateTime(analysis.updated_at)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={runAnalysis} disabled={running}>
                {running ? <Loader2 className="animate-spin" /> : <Sparkles />}
                إعادة التحليل الذكي
              </Button>
            </div>

            {analysis.source === "demo" && (
              <Notice tone="demo" title="تحليل تجريبي للعرض">
                هذا المحتوى مُعدّ مسبقًا لتوضيح شكل النتائج، وليس ناتجًا عن تحليل ذكي. يمكنك تعديله بحرية.
              </Notice>
            )}
            {serviceMessage && (
              <Notice tone="offline" title="التحليل الذكي غير متاح حاليًا">
                {serviceMessage}
              </Notice>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {SECTIONS.map((s) => (
                <AnalysisSection
                  key={s.key}
                  title={s.title}
                  hint={s.hint}
                  icon={<s.icon />}
                  tone={s.tone}
                  count={analysis[s.key].length}
                  className={s.key === "questions" ? "xl:col-span-2" : undefined}
                >
                  <ListEditorStrings
                    value={analysis[s.key]}
                    onChange={(next) => update({ [s.key]: next })}
                    placeholder={s.placeholder}
                    bulletClassName={s.bullet}
                    emptyText="لا شيء مسجّل في هذا القسم."
                  />
                </AnalysisSection>
              ))}
            </div>

            <section className="surface-card p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">رسالة جاهزة للإرسال للعميل</h3>
                  <p className="text-xs text-muted-foreground">تُصاغ من أسئلة التوضيح أعلاه، ويمكنك تعديلها قبل الإرسال.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={analysis.questions.length === 0}
                  onClick={() =>
                    update({
                      client_message: composeClarificationMessage(project.client_name, analysis.questions, profile.full_name),
                    })
                  }
                >
                  <Wand2 />
                  صياغة من الأسئلة
                </Button>
              </div>
              <Textarea
                value={analysis.client_message}
                onChange={(e) => update({ client_message: e.target.value })}
                rows={9}
                placeholder="اكتب رسالتك للعميل أو اضغط «صياغة من الأسئلة»."
                className="leading-7"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled={!analysis.client_message.trim()} onClick={() => copy(analysis.client_message)}>
                  <Copy />
                  نسخ
                </Button>
                <Button
                  size="sm"
                  disabled={!analysis.client_message.trim()}
                  onClick={() => {
                    addMessage({ project_id: project.id, author: "freelancer", kind: "message", content: analysis.client_message });
                    if (project.status === "pending") updateProject(project.id, { status: "needs_clarification" });
                    toast.success("سُجّلت الرسالة في سجل المشروع");
                  }}
                >
                  <Send />
                  تسجيل كرسالة مُرسلة
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ms-auto"
                  onClick={() => navigate({ to: "/projects/$projectId/scope", params: { projectId } })}
                >
                  الانتقال إلى نطاق العمل
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function AnalysisSection({
  title,
  hint,
  icon,
  tone,
  count,
  children,
  className,
}: {
  title: string;
  hint: string;
  icon: ReactNode;
  tone: string;
  count: number;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <section className={cn("surface-card p-4", className)}>
      <div className="mb-3 flex items-start gap-3">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4", tone)}>{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            <span className="num rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{count}</span>
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
