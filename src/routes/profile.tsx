import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Clock, Pencil, Plus, RefreshCcw, Trash2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { DemoBadge } from "@/components/common/status-badges";
import { ServiceDialog } from "@/components/services/service-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useActions, useAppData } from "@/data/store";
import { formatMoney } from "@/lib/format";
import { PRICING_MODEL_LABEL } from "@/lib/labels";
import type { Profile, Service } from "@/lib/types";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "الملف الشخصي والخدمات — SCOPE" },
      { name: "description", content: "معلوماتك المهنية وخدماتك مع المخرجات والاستثناءات وحدود التعديل وقواعد التسعير." },
      { property: "og:title", content: "الملف الشخصي والخدمات — SCOPE" },
      { property: "og:description", content: "معلوماتك المهنية وخدماتك مع المخرجات والاستثناءات وحدود التعديل وقواعد التسعير." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, services } = useAppData();
  return (
    <div className="space-y-6">
      <PageHeader
        title="الملف الشخصي والخدمات"
        description="خدماتك هي الأساس الذي يُبنى عليه نطاق العمل لكل مشروع جديد."
        actions={<DemoBadge />}
      />
      <Tabs defaultValue="services" className="space-y-6">
        <TabsList>
          <TabsTrigger value="services">
            الخدمات <span className="num ms-1.5 text-xs text-muted-foreground">{services.length}</span>
          </TabsTrigger>
          <TabsTrigger value="info">المعلومات الشخصية</TabsTrigger>
        </TabsList>
        <TabsContent value="services">
          <ServicesSection />
        </TabsContent>
        <TabsContent value="info">
          <ProfileForm profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const { updateProfile } = useActions();
  const [form, setForm] = useState(profile);
  useEffect(() => setForm(profile), [profile]);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(profile);

  return (
    <form
      className="surface-card max-w-3xl space-y-6 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.full_name.trim()) {
          toast.error("الاسم مطلوب");
          return;
        }
        updateProfile(form);
        toast.success("تم حفظ الملف الشخصي");
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-violet-soft font-display text-2xl font-semibold text-violet">
          {form.full_name.charAt(0) || "؟"}
        </div>
        <div>
          <div className="text-base font-semibold">{form.full_name || "—"}</div>
          <div className="text-sm text-muted-foreground">{form.specialty}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="الاسم الكامل" id="full_name">
          <Input id="full_name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </Field>
        <Field label="التخصص المهني" id="specialty">
          <Input id="specialty" value={form.specialty} onChange={(e) => set("specialty", e.target.value)} />
        </Field>
        <Field label="البريد الإلكتروني" id="email">
          <Input id="email" type="email" dir="ltr" className="text-end" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="رقم الهاتف" id="phone">
          <Input id="phone" dir="ltr" className="text-end" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="المدينة / الدولة" id="location">
          <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="سنوات الخبرة" id="years">
            <Input
              id="years"
              type="number"
              min={0}
              value={form.years_experience}
              onChange={(e) => set("years_experience", Math.max(0, Number(e.target.value) || 0))}
            />
          </Field>
          <Field label="العملة" id="currency">
            <Input id="currency" value={form.currency} onChange={(e) => set("currency", e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="نبذة مهنية" id="bio">
            <Textarea id="bio" rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={!dirty}>
          حفظ التغييرات
        </Button>
        <Button type="button" variant="outline" disabled={!dirty} onClick={() => setForm(profile)}>
          تراجع
        </Button>
      </div>
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function ServicesSection() {
  const { services, profile } = useAppData();
  const { saveService, deleteService } = useActions();
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus />
          خدمة جديدة
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState icon={<Briefcase />} title="لا توجد خدمات بعد" description="أضف أول خدمة تقدّمها لتبدأ منها نطاقات العمل." />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {services.map((s) => (
            <article key={s.id} className="surface-card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{s.name}</h3>
                    {!s.is_active && <Badge variant="muted">معطّلة</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="تعديل الخدمة"
                    onClick={() => {
                      setEditing(s);
                      setOpen(true);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:text-destructive"
                    aria-label="حذف الخدمة"
                    onClick={() => setToDelete(s)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-3 text-xs">
                <Meta icon={<Wallet />} label={PRICING_MODEL_LABEL[s.pricing_model]} value={formatMoney(s.base_price, profile.currency)} />
                <Meta icon={<RefreshCcw />} label="جولات التعديل" value={String(s.revision_limit)} />
                <Meta icon={<Clock />} label="مدة التسليم" value={`${s.delivery_days} يومًا`} />
              </div>

              <div className="mt-4 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                <BulletList title="المخرجات" items={s.deliverables} dot="bg-success" />
                {(s.inclusions?.length ?? 0) > 0 && <BulletList title="الخدمات المشمولة" items={s.inclusions ?? []} dot="bg-primary" />}
                <BulletList title="الاستثناءات" items={s.exclusions} dot="bg-destructive" />
              </div>
              {s.pricing_rules && (
                <p className="mt-4 border-t pt-3 text-xs leading-5 text-muted-foreground">
                  <span className="font-medium text-foreground">قواعد التسعير: </span>
                  {s.pricing_rules}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <ServiceDialog
        open={open}
        onOpenChange={setOpen}
        service={editing}
        currency={profile.currency}
        onSave={(draft) => {
          saveService(draft);
          setOpen(false);
          toast.success(editing ? "تم تحديث الخدمة" : "تمت إضافة الخدمة");
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الخدمة؟</AlertDialogTitle>
            <AlertDialogDescription>
              ستُحذف «{toDelete?.name}». المشاريع المرتبطة بها ستبقى، لكن بدون خدمة محددة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) deleteService(toDelete.id);
                toast.success("تم حذف الخدمة");
                setToDelete(null);
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </div>
      <div className="num text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function BulletList({ title, items, dot }: { title: string; items: string[]; dot: string }) {
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
