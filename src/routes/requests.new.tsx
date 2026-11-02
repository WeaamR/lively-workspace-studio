import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileUp, Loader2, Paperclip, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActions, useAppData } from "@/data/store";
import { formatFileSize, formatMoney } from "@/lib/format";
import { PRICING_MODEL_LABEL } from "@/lib/labels";
import type { Attachment } from "@/lib/types";
import { analyzeClientRequest } from "@/services/ai";
import { demoAnalyzeRequest, withDraftMessage } from "@/services/demo-engine";

export const Route = createFileRoute("/requests/new")({
  head: () => ({
    meta: [
      { title: "طلب عميل جديد — SCOPE" },
      { name: "description", content: "الصق رسالة العميل واختر الخدمة لتحليل الطلب وتحديد المعلومات الناقصة." },
      { property: "og:title", content: "طلب عميل جديد — SCOPE" },
      { property: "og:description", content: "الصق رسالة العميل واختر الخدمة لتحليل الطلب وتحديد المعلومات الناقصة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewRequestPage,
});

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;
const NO_SERVICE = "none";

function NewRequestPage() {
  const { services, profile } = useAppData();
  const { createProject, saveAnalysis } = useActions();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const active = services.filter((s) => s.is_active);
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [serviceId, setServiceId] = useState<string>(active[0]?.id ?? NO_SERVICE);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<{ title?: string; client?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const service = services.find((s) => s.id === serviceId) ?? null;

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_FILES) {
        toast.error(`الحد الأقصى ${MAX_FILES} مرفقات`);
        break;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`«${f.name}» أكبر من 10MB`);
        continue;
      }
      if (!next.some((x) => x.name === f.name)) next.push({ name: f.name, size: f.size, type: f.type });
    }
    setFiles(next);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { title?: string; client?: string; message?: string } = {};
    if (!title.trim()) errs.title = "عنوان المشروع مطلوب.";
    if (!client.trim()) errs.client = "اسم العميل مطلوب.";
    if (message.trim().length < 20) errs.message = "الصق رسالة العميل كاملة (20 حرفًا على الأقل).";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    const projectId = createProject({
      title,
      client_name: client,
      service_id: serviceId === NO_SERVICE ? null : serviceId,
      original_request: message,
      attachments: files,
    });
    const res = await analyzeClientRequest({ projectId, title, clientMessage: message, service, attachments: files });
    setSubmitting(false);
    if (res.status === "ok") {
      saveAnalysis(projectId, { ...res.data, source: "ai" });
      toast.success("تم إنشاء المشروع وتحليل الطلب");
    } else {
      saveAnalysis(projectId, withDraftMessage(demoAnalyzeRequest(message, service), client.trim(), profile.full_name));
      toast.info("تم إنشاء المشروع", { description: "التحليل الذكي غير متصل بعد — عُرض تحليل تجريبي قائم على قواعد بسيطة." });
    }
    navigate({ to: "/projects/$projectId/analysis", params: { projectId } });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="طلب عميل جديد" description="الصق رسالة العميل كما وصلتك، دون تعديل، ليكون التحليل مبنيًا على كلامه الفعلي." />

      <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-3" noValidate>
        <div className="surface-card space-y-5 p-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">عنوان المشروع</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: هوية بصرية لمخبز" aria-invalid={!!errors.title} />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client">اسم العميل</Label>
              <Input id="client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="مثال: سامر الحسن" aria-invalid={!!errors.client} />
              {errors.client && <p className="text-xs text-destructive">{errors.client}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>الخدمة المطلوبة</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {active.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
                <SelectItem value={NO_SERVICE}>بدون خدمة محددة</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              تحتاج خدمة جديدة؟{" "}
              <Link to="/profile" className="text-primary hover:underline">
                أدر خدماتك
              </Link>
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">رسالة العميل الأصلية</Label>
              <span className="num text-xs text-muted-foreground">{message.length} حرف</span>
            </div>
            <Textarea
              id="message"
              rows={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="الصق نص رسالة العميل هنا…"
              className="leading-7"
              aria-invalid={!!errors.message}
            />
            {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>المرفقات (اختياري)</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFiles(e.dataTransfer.files);
              }}
              className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed bg-muted/40 px-4 py-6 text-center transition-colors hover:bg-muted"
            >
              <FileUp className="size-5 text-muted-foreground" />
              <span className="text-sm">اسحب الملفات هنا أو اضغط للاختيار</span>
              <span className="text-xs text-muted-foreground">حتى {MAX_FILES} ملفات، 10MB لكل ملف</span>
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            {files.length > 0 && (
              <ul className="space-y-1.5">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <Paperclip className="size-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="num text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`إزالة ${f.name}`}
                      onClick={() => setFiles(files.filter((x) => x.name !== f.name))}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">في هذه المرحلة تُحفظ أسماء الملفات فقط، ويُفعَّل الرفع الفعلي لاحقًا.</p>
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-5">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Sparkles />}
              تحليل الطلب
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => navigate({ to: "/projects" })}>
              إلغاء
            </Button>
          </div>
        </div>

        <aside className="surface-card h-fit space-y-4 p-5">
          <h2 className="text-sm font-semibold">ملخص الخدمة المختارة</h2>
          {service ? (
            <>
              <div>
                <div className="text-base font-semibold">{service.name}</div>
                <div className="num text-sm text-muted-foreground">
                  {PRICING_MODEL_LABEL[service.pricing_model]} · {formatMoney(service.base_price, profile.currency)} ·{" "}
                  {service.delivery_days} يومًا · {service.revision_limit} جولات تعديل
                </div>
              </div>
              <Summary title="المخرجات" items={service.deliverables} dot="bg-success" />
              <Summary title="الاستثناءات" items={service.exclusions} dot="bg-destructive" />
              <p className="rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                سيُقارن التحليل طلب العميل بهذه المخرجات والاستثناءات لتحديد ما هو خارج الخدمة.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">لم تُحدَّد خدمة. سيُحلَّل الطلب دون مقارنة بخدمة معيّنة.</p>
          )}
        </aside>
      </form>
    </div>
  );
}

function Summary({ title, items, dot }: { title: string; items: string[]; dot: string }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{title}</div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={`mt-2 size-1.5 shrink-0 rounded-full ${dot}`} />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
