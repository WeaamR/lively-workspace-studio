import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, GitCompareArrows, Loader2, Plus, Quote, Send, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Notice } from "@/components/common/notice";
import { CLASSIFICATION_VARIANT, ClassificationBadge, SourceBadge } from "@/components/common/status-badges";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProjectBundle } from "@/data/selectors";
import { useActions, useAppData } from "@/data/store";
import { formatDate, formatDateTime, newId } from "@/lib/format";
import { CLASSIFICATION_LABEL, SCOPE_CATEGORY_LABEL } from "@/lib/labels";
import { clauseRef, composeChangeResponse } from "@/lib/scope";
import type { ChangeAnalysis, ChangeClassification, ChangeItem, ProjectMessage, ScopeItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { compareAgainstScope } from "@/services/ai";
import { demoCompare } from "@/services/demo-engine";

export const Route = createFileRoute("/_authenticated/projects/$projectId/changes")({
  head: () => ({
    meta: [
      { title: "كشف التغييرات — SCOPE" },
      { name: "description", content: "قارن رسائل العميل الجديدة بنطاق العمل المعتمد وصنّف كل طلب مع البند الداعم." },
      { property: "og:title", content: "كشف التغييرات — SCOPE" },
      { property: "og:description", content: "قارن رسائل العميل الجديدة بنطاق العمل المعتمد وصنّف كل طلب مع البند الداعم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChangesPage,
});

const CLASSIFICATIONS: ChangeClassification[] = ["within_scope", "additional_work", "needs_clarification"];
const NO_CLAUSE = "none";

function ChangesPage() {
  const { projectId } = Route.useParams();
  const { project, approved, messages, itemsFor, profile } = useProjectBundle(projectId);
  const { addMessage, deleteChangeReview } = useActions();
  const changeMessages = messages.filter((m) => m.kind === "change_request").reverse();
  const [selectedId, setSelectedId] = useState<string | null>(changeMessages[0]?.id ?? null);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const confirmDeleteReview = (id: string) => {
    if (deletingId) return; // prevent duplicate delete requests
    setDeletingId(id);
    const ok = deleteChangeReview(id);
    setDeletingId(null);
    if (ok) {
      toast.success("حُذف طلب التغيير", { description: "بقيت رسالة العميل الأصلية محفوظة في سجل المشروع." });
    } else {
      toast.error("تعذّر حذف طلب التغيير");
    }
  };

  if (!project) return null;

  if (!approved) {
    return (
      <EmptyState
        icon={<GitCompareArrows />}
        title="لا يوجد نطاق معتمد بعد"
        description="كشف التغييرات يقارن رسائل العميل بآخر نسخة معتمدة من نطاق العمل. اعتمد النطاق أولًا."
        action={
          <Button asChild>
            <Link to="/projects/$projectId/scope" params={{ projectId }}>
              الذهاب إلى نطاق العمل
            </Link>
          </Button>
        }
      />
    );
  }

  const compare = async () => {
    if (!text.trim()) return;
    setRunning(true);
    const res = await compareAgainstScope({
      projectId,
      newMessage: text.trim(),
      scopeVersion: approved,
      scopeItems: itemsFor(approved.id),
    });
    setRunning(false);
    const analysis: ChangeAnalysis =
      res.status === "ok"
        ? {
            scope_version_id: approved.id,
            items: res.data.items.map((i) => ({ ...i, id: newId() })),
            suggested_response: res.data.suggested_response,
            source: "ai",
            created_at: new Date().toISOString(),
          }
        : {
            scope_version_id: approved.id,
            ...demoCompare(text.trim(), approved, itemsFor(approved.id), project.client_name, profile.full_name),
            source: "demo",
            created_at: new Date().toISOString(),
          };
    const id = addMessage({ project_id: projectId, author: "client", kind: "change_request", content: text.trim(), change_analysis: analysis });
    setSelectedId(id);
    setText("");
    setServiceMessage(res.status === "ok" ? null : "المقارنة الذكية غير متصلة بعد، لذلك شُغّلت مقارنة تجريبية بالكلمات المفتاحية.");
    toast.success("سُجّلت رسالة العميل في سجل المشروع");
  };

  const selected = changeMessages.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="surface-card flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          المقارنة تتم مع <span className="font-semibold">النسخة {approved.version_number} المعتمدة</span>
          <span className="num text-muted-foreground"> · اعتُمدت {formatDate(approved.approved_at)}</span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/projects/$projectId/scope" params={{ projectId }}>
            عرض بنود النطاق
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <aside className="space-y-4 lg:col-span-1">
          <section className="surface-card space-y-3 p-4">
            <h2 className="text-sm font-semibold">رسالة جديدة من العميل</h2>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="الصق نص رسالة العميل الجديدة هنا…"
              className="leading-7"
            />
            <Button className="w-full" onClick={compare} disabled={!text.trim() || running}>
              {running ? <Loader2 className="animate-spin" /> : <GitCompareArrows />}
              مقارنة بالنطاق المعتمد
            </Button>
          </section>

          <section className="surface-card p-4">
            <h2 className="mb-3 text-sm font-semibold">طلبات التغيير</h2>
            {changeMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد طلبات تغيير مسجّلة بعد.</p>
            ) : (
              <ul className="space-y-1.5">
                {changeMessages.map((m) => (
                  <li key={m.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedId(m.id)}
                      className={cn(
                        "min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-start transition-colors",
                        m.id === selected?.id ? "border-primary/40 bg-primary-soft" : "border-transparent hover:bg-muted",
                      )}
                    >
                      <p className="line-clamp-2 text-sm">{m.content}</p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="num text-xs text-muted-foreground">{formatDateTime(m.created_at)}</span>
                        {m.change_analysis ? (
                          <span className="num text-xs text-muted-foreground">{m.change_analysis.items.length} بنود</span>
                        ) : (
                          <Badge variant="muted">لم يُقارن</Badge>
                        )}
                      </div>
                    </button>
                    {m.change_analysis && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                            title="حذف طلب التغيير"
                            aria-label="حذف طلب التغيير"
                            disabled={deletingId === m.id}
                          >
                            {deletingId === m.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف طلب التغيير</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف طلب التغيير؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => confirmDeleteReview(m.id)}>حذف</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <div className="space-y-4 lg:col-span-2">
          {serviceMessage && (
            <Notice tone="offline" title="المقارنة الذكية غير متاحة حاليًا">
              {serviceMessage} راجع التصنيفات والبنود وعدّلها عند الحاجة.
            </Notice>
          )}
          {selected ? (
            <ChangeDetail key={selected.id} message={selected} approvedVersionId={approved.id} clientName={project.client_name} />
          ) : (
            <EmptyState
              icon={<GitCompareArrows />}
              title="اختر طلب تغيير أو أضف رسالة جديدة"
              description="ستظهر هنا مقارنة كل طلب بالنطاق المعتمد مع البند الذي يدعم التصنيف."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ChangeDetail({
  message,
  approvedVersionId,
  clientName,
}: {
  message: ProjectMessage;
  approvedVersionId: string;
  clientName: string;
}) {
  const { scopeVersions, scopeItems, profile } = useAppData();
  const { setChangeAnalysis, addMessage } = useActions();
  const ca = message.change_analysis;

  if (!ca) {
    return (
      <div className="space-y-4">
        <MessageCard message={message} />
        <EmptyState
          title="لم تُقارن هذه الرسالة بعد"
          description="ابدأ مقارنة يدوية مع النسخة المعتمدة الحالية وصنّف كل طلب."
          action={
            <Button
              onClick={() =>
                setChangeAnalysis(message.id, {
                  scope_version_id: approvedVersionId,
                  items: [],
                  suggested_response: "",
                  source: "manual",
                  created_at: new Date().toISOString(),
                })
              }
            >
              بدء المقارنة اليدوية
            </Button>
          }
        />
      </div>
    );
  }

  const version = scopeVersions.find((v) => v.id === ca.scope_version_id);
  const versionItems = scopeItems.filter((i) => i.scope_version_id === ca.scope_version_id);
  const itemById = (id: string | null) => versionItems.find((i) => i.id === id) ?? null;
  const save = (patch: Partial<ChangeAnalysis>) => setChangeAnalysis(message.id, { ...ca, ...patch });
  const updateItem = (id: string, patch: Partial<ChangeItem>) =>
    save({ items: ca.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  const counts = CLASSIFICATIONS.map((c) => ({ c, n: ca.items.filter((i) => i.classification === c).length }));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ca.suggested_response);
      toast.success("تم نسخ الرد");
    } catch {
      toast.error("تعذّر النسخ، انسخ النص يدويًا.");
    }
  };

  return (
    <div className="space-y-4">
      <MessageCard message={message} />

      {ca.source === "demo" && (
        <Notice tone="demo" title="مقارنة تجريبية — ليست ذكاءً اصطناعيًا">
          التصنيفات ناتجة عن مطابقة كلمات بسيطة أو مُعدّة مسبقًا للعرض. راجعها قبل إرسال أي رد.
        </Notice>
      )}
      {version && version.id !== approvedVersionId && (
        <Notice tone="info" title={`قورنت هذه الرسالة بالنسخة ${version.version_number}`}>
          توجد الآن نسخة معتمدة أحدث. البنود المعروضة هنا من النسخة التي قورنت بها الرسالة.
        </Notice>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SourceBadge source={ca.source} />
        {counts.map(({ c, n }) => (
          <Badge key={c} variant={CLASSIFICATION_VARIANT[c]}>
            {CLASSIFICATION_LABEL[c]} · <span className="num">{n}</span>
          </Badge>
        ))}
      </div>

      <ul className="space-y-3">
        {ca.items.map((item) => {
          const clause = itemById(item.scope_item_id);
          return (
            <li key={item.id} className="surface-card space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <ClassificationBadge value={item.classification} />
                  <p className="text-sm font-medium leading-6">{item.request_text}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="حذف البند"
                  onClick={() => save({ items: ca.items.filter((i) => i.id !== item.id) })}
                >
                  <Trash2 />
                </Button>
              </div>

              {clause ? (
                <ClauseQuote clause={clause} versionItems={versionItems} />
              ) : (
                <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  لا يوجد بند في النطاق يدعم هذا التصنيف — اربطه ببند أدناه أو صنّفه «يحتاج توضيحًا».
                </p>
              )}

              {item.note && <p className="text-xs leading-5 text-muted-foreground">{item.note}</p>}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Select
                  value={item.classification}
                  onValueChange={(v) => updateItem(item.id, { classification: v as ChangeClassification })}
                >
                  <SelectTrigger className="h-9" aria-label="التصنيف">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSIFICATIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CLASSIFICATION_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ClauseSelect
                  value={item.scope_item_id}
                  items={versionItems}
                  onChange={(id) => updateItem(item.id, { scope_item_id: id })}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <AddChangeItem versionItems={versionItems} onAdd={(i) => save({ items: [...ca.items, { ...i, id: newId() }] })} />

      <section className="surface-card p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">الرد المقترح على العميل</h3>
            <p className="text-xs text-muted-foreground">يُصاغ من التصنيفات والبنود أعلاه، ويمكنك تعديله.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={ca.items.length === 0}
            onClick={() =>
              save({
                suggested_response: composeChangeResponse(
                  clientName,
                  ca.items,
                  (id) => {
                    const c = itemById(id);
                    return c ? clauseRef(c, versionItems) : null;
                  },
                  profile.full_name,
                ),
              })
            }
          >
            <Wand2 />
            صياغة من التصنيفات
          </Button>
        </div>
        <Textarea
          rows={10}
          value={ca.suggested_response}
          onChange={(e) => save({ suggested_response: e.target.value })}
          placeholder="اكتب ردك أو اضغط «صياغة من التصنيفات»."
          className="leading-7"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={!ca.suggested_response.trim()} onClick={copy}>
            <Copy />
            نسخ
          </Button>
          <Button
            size="sm"
            disabled={!ca.suggested_response.trim()}
            onClick={() => {
              addMessage({ project_id: message.project_id, author: "freelancer", kind: "message", content: ca.suggested_response });
              toast.success("سُجّل الرد في سجل المشروع");
            }}
          >
            <Send />
            تسجيل كرد مُرسل
          </Button>
        </div>
      </section>
    </div>
  );
}

function MessageCard({ message }: { message: ProjectMessage }) {
  return (
    <section className="surface-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">رسالة العميل</h2>
        <span className="num text-xs text-muted-foreground">{formatDateTime(message.created_at)}</span>
      </div>
      <blockquote className="whitespace-pre-line rounded-lg border-s-4 border-violet/40 bg-violet-soft/60 px-4 py-3 text-sm leading-7">
        {message.content}
      </blockquote>
    </section>
  );
}

function ClauseQuote({ clause, versionItems }: { clause: ScopeItem; versionItems: ScopeItem[] }) {
  return (
    <div className="flex gap-2.5 rounded-lg bg-muted/70 px-3 py-2.5">
      <Quote className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="space-y-0.5">
        <div className="text-xs font-medium text-muted-foreground">
          البند <span className="num">{clauseRef(clause, versionItems)}</span> · {SCOPE_CATEGORY_LABEL[clause.category]}
        </div>
        <p className="text-sm leading-6 text-foreground">«{clause.content}»</p>
      </div>
    </div>
  );
}

function ClauseSelect({
  value,
  items,
  onChange,
}: {
  value: string | null;
  items: ScopeItem[];
  onChange: (id: string | null) => void;
}) {
  return (
    <Select value={value ?? NO_CLAUSE} onValueChange={(v) => onChange(v === NO_CLAUSE ? null : v)}>
      <SelectTrigger className="h-9" aria-label="البند الداعم">
        <SelectValue placeholder="البند الداعم" />
      </SelectTrigger>
      <SelectContent className="max-w-[min(32rem,90vw)]">
        <SelectItem value={NO_CLAUSE}>بدون بند مرتبط</SelectItem>
        {items.map((i) => (
          <SelectItem key={i.id} value={i.id}>
            <span className="num me-1 text-muted-foreground">{clauseRef(i, items)}</span>
            <span className="truncate">{i.content}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AddChangeItem({
  versionItems,
  onAdd,
}: {
  versionItems: ScopeItem[];
  onAdd: (item: Omit<ChangeItem, "id">) => void;
}) {
  const [text, setText] = useState("");
  const [classification, setClassification] = useState<ChangeClassification>("needs_clarification");
  const [clause, setClause] = useState<string | null>(null);
  const [note, setNote] = useState("");

  return (
    <section className="surface-card space-y-3 border-dashed p-4">
      <h3 className="text-sm font-semibold">إضافة طلب من الرسالة</h3>
      <div className="space-y-1.5">
        <Label htmlFor="req">الطلب كما ورد</Label>
        <Input id="req" value={text} onChange={(e) => setText(e.target.value)} placeholder="مثال: إضافة صفحة للمدونة" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select value={classification} onValueChange={(v) => setClassification(v as ChangeClassification)}>
          <SelectTrigger className="h-9" aria-label="التصنيف">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLASSIFICATIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {CLASSIFICATION_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ClauseSelect value={clause} items={versionItems} onChange={setClause} />
      </div>
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة (اختياري)" />
      <Button
        variant="outline"
        size="sm"
        disabled={!text.trim()}
        onClick={() => {
          onAdd({ request_text: text.trim(), classification, scope_item_id: clause, note: note.trim() });
          setText("");
          setNote("");
          setClause(null);
          setClassification("needs_clarification");
        }}
      >
        <Plus />
        إضافة الطلب
      </Button>
    </section>
  );
}
