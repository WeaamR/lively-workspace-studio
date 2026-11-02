import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, CopyPlus, Save, FilePlus2, FileText, Lock, Send, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { ListEditor } from "@/components/common/list-editor";
import { Notice } from "@/components/common/notice";
import { ScopeStatusBadge } from "@/components/common/status-badges";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjectBundle } from "@/data/selectors";
import { useActions } from "@/data/store";
import { formatDate } from "@/lib/format";
import { SCOPE_CATEGORY_HINT, SCOPE_CATEGORY_LABEL, SCOPE_CATEGORY_ORDER } from "@/lib/labels";
import { clauseRef, itemsByCategory } from "@/lib/scope";
import type { ScopeVersion } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/scope")({
  head: () => ({
    meta: [
      { title: "نطاق العمل — SCOPE" },
      { name: "description", content: "نطاق عمل قابل للتعديل: المخرجات، المشمول، المستثنى، التعديلات، الموعد والشروط." },
      { property: "og:title", content: "نطاق العمل — SCOPE" },
      { property: "og:description", content: "نطاق عمل قابل للتعديل: المخرجات، المشمول، المستثنى، التعديلات، الموعد والشروط." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScopePage,
});

function ScopePage() {
  const { projectId } = Route.useParams();
  const { project, service, versions, itemsFor } = useProjectBundle(projectId);
  const actions = useActions();
  const [selectedId, setSelectedId] = useState<string | null>(versions[0]?.id ?? null);

  // Follow the newest version when one is created.
  const newestId = versions[0]?.id ?? null;
  useEffect(() => {
    setSelectedId(newestId);
  }, [newestId]);

  if (!project) return null;

  if (versions.length === 0) {
    return (
      <EmptyState
        icon={<FileText />}
        title="لا يوجد نطاق عمل بعد"
        description={
          service
            ? `أنشئ مسودة تبدأ بمخرجات واستثناءات خدمة «${service.name}»، ثم عدّلها لتناسب هذا المشروع.`
            : "أنشئ مسودة فارغة وأضف بنود النطاق."
        }
        action={
          <Button onClick={() => actions.createScopeVersion(project.id)}>
            <FilePlus2 />
            إنشاء مسودة النطاق
          </Button>
        }
      />
    );
  }

  const version = (versions.find((v) => v.id === selectedId) ?? versions[0])!;
  const items = itemsFor(version.id);
  const editable = version.status === "draft";
  const hasDraft = versions.some((v) => v.status === "draft" || v.status === "pending_approval");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <aside className="space-y-4 lg:col-span-1">
        <div className="surface-card p-4">
          <h2 className="mb-3 text-sm font-semibold">نسخ النطاق</h2>
          <ul className="space-y-1.5">
            {versions.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2.5 text-start transition-colors",
                    v.id === version.id ? "border-primary/40 bg-primary-soft" : "border-transparent hover:bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">النسخة {v.version_number}</span>
                    <ScopeStatusBadge status={v.status} />
                  </div>
                  <div className="num mt-1 text-xs text-muted-foreground">
                    {v.approved_at ? `اعتُمدت ${formatDate(v.approved_at)}` : `أُنشئت ${formatDate(v.created_at)}`}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {!hasDraft && (
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => actions.createScopeVersion(project.id)}>
              <CopyPlus />
              إنشاء نسخة معدّلة
            </Button>
          )}
        </div>
        <ApprovalTrack version={version} />
      </aside>

      <div className="space-y-5 lg:col-span-3">
        <div className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">نطاق العمل — النسخة {version.version_number}</h2>
              <ScopeStatusBadge status={version.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {editable ? "مسودة قابلة للتعديل. البنود مرقّمة ليُشار إليها عند كشف التغييرات." : "هذه النسخة مقفلة للقراءة فقط."}
            </p>
          </div>
          <VersionActions version={version} itemCount={items.length} />
        </div>

        {version.status === "superseded" && (
          <Notice tone="info" title="نسخة سابقة">
            استُبدلت هذه النسخة بنسخة أحدث معتمدة. تُعرض هنا للرجوع إليها فقط.
          </Notice>
        )}

        <div className="surface-card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="deadline">موعد التسليم</Label>
            <Input
              id="deadline"
              type="date"
              disabled={!editable}
              value={version.delivery_deadline ?? ""}
              onChange={(e) => actions.updateScopeVersion(version.id, { delivery_deadline: e.target.value || null })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="revisions">عدد جولات التعديل</Label>
            <Input
              id="revisions"
              type="number"
              min={0}
              disabled={!editable}
              value={version.revision_rounds}
              onChange={(e) =>
                actions.updateScopeVersion(version.id, { revision_rounds: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">ملاحظات النسخة</Label>
            <Textarea
              id="notes"
              rows={2}
              disabled={!editable}
              value={version.notes}
              onChange={(e) => actions.updateScopeVersion(version.id, { notes: e.target.value })}
              placeholder="مثال: ما الذي تغيّر في هذه النسخة؟"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {SCOPE_CATEGORY_ORDER.map((category, idx) => {
            const list = itemsByCategory(items, category);
            return (
              <section key={category} className={cn("surface-card p-5", category === "condition" && "xl:col-span-2")}>
                <div className="mb-3 flex items-start gap-3">
                  <span className="num flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{SCOPE_CATEGORY_LABEL[category]}</h3>
                    <p className="text-xs text-muted-foreground">{SCOPE_CATEGORY_HINT[category]}</p>
                  </div>
                  {!editable && <Lock className="ms-auto size-3.5 text-muted-foreground" />}
                </div>
                <ListEditor
                  readOnly={!editable}
                  items={list.map((i) => ({
                    id: i.id,
                    content: i.content,
                    marker: (
                      <span className="num mt-0.5 w-8 shrink-0 text-xs font-medium text-muted-foreground">
                        {clauseRef(i, items)}
                      </span>
                    ),
                  }))}
                  onAdd={(c) => actions.addScopeItem(version.id, category, c)}
                  onUpdate={(id, c) => actions.updateScopeItem(id, c)}
                  onRemove={(id) => actions.removeScopeItem(id)}
                  placeholder="أضف بندًا…"
                  emptyText="لا توجد بنود."
                />
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VersionActions({ version, itemCount }: { version: ScopeVersion; itemCount: number }) {
  const actions = useActions();

  if (version.status === "draft") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => toast.success(`حُفظت مسودة النسخة ${version.version_number}`)}>
          <Save />
          حفظ المسودة
        </Button>
        <Button
          variant="outline"
          disabled={itemCount === 0}
          onClick={() => {
            actions.sendScopeForApproval(version.id);
            toast.success("تم تحديد النطاق كمُرسل للعميل", { description: "سجّل موافقة العميل عند وصولها." });
          }}
        >
          <Send />
          إرسال للعميل
        </Button>
        {itemCount > 0 && <ApproveButton version={version} />}
      </div>
    );
  }

  if (version.status === "pending_approval") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => actions.revertScopeToDraft(version.id)}>
          <Undo2 />
          إعادة إلى المسودة
        </Button>
        <ApproveButton version={version} />
      </div>
    );
  }

  return null;
}

function ApproveButton({ version }: { version: ScopeVersion }) {
  const actions = useActions();
  return (
    <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>
              <CheckCircle2 />
              اعتماد النطاق
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد موافقة العميل؟</AlertDialogTitle>
              <AlertDialogDescription>
                ستصبح النسخة {version.version_number} هي النطاق المعتمد الذي تُقارن به طلبات التغيير، وستُقفل للتعديل. أي
                نسخة معتمدة سابقة ستُحفظ كنسخة سابقة.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  actions.approveScope(version.id);
                  toast.success(`اعتُمدت النسخة ${version.version_number}`);
                }}
              >
                تأكيد الاعتماد
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
  );
}

function ApprovalTrack({ version }: { version: ScopeVersion }) {
  const steps = [
    { label: "إنشاء المسودة", at: version.created_at, done: true },
    { label: "إرسال للعميل", at: version.sent_at, done: !!version.sent_at },
    { label: "موافقة العميل", at: version.approved_at, done: !!version.approved_at },
  ];
  return (
    <div className="surface-card p-4">
      <h2 className="mb-3 text-sm font-semibold">حالة الموافقة</h2>
      <ol className="space-y-3">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                s.done ? "border-success bg-success-soft text-success" : "border-dashed text-muted-foreground",
              )}
            >
              {s.done ? <CheckCircle2 className="size-3.5" /> : null}
            </span>
            <div className="flex-1">
              <div className={cn("text-sm", s.done ? "text-foreground" : "text-muted-foreground")}>{s.label}</div>
              <div className="num text-xs text-muted-foreground">{s.done ? formatDate(s.at) : "—"}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
