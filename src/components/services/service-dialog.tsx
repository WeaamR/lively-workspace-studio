import { useEffect, useState } from "react";

import { ListEditorStrings } from "@/components/common/list-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PRICING_MODEL_LABEL } from "@/lib/labels";
import type { PricingModel, Service } from "@/lib/types";

export type ServiceDraft = Omit<Service, "id" | "user_id" | "created_at"> & { id?: string };

const EMPTY: ServiceDraft = {
  name: "",
  description: "",
  deliverables: [],
  exclusions: [],
  revision_limit: 2,
  delivery_days: 14,
  pricing_model: "fixed",
  base_price: 0,
  pricing_rules: "",
  is_active: true,
};

export function ServiceDialog({
  open,
  onOpenChange,
  service,
  currency,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  service: Service | null;
  currency: string;
  onSave: (s: ServiceDraft) => void;
}) {
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(service ? { ...service } : EMPTY);
      setError(null);
    }
  }, [open, service]);

  const set = <K extends keyof ServiceDraft>(k: K, v: ServiceDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = () => {
    if (!draft.name.trim()) return setError("اسم الخدمة مطلوب.");
    if (draft.deliverables.length === 0) return setError("أضف مُخرَجًا واحدًا على الأقل.");
    onSave({ ...draft, name: draft.name.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="text-start">
          <DialogTitle>{service ? "تعديل الخدمة" : "خدمة جديدة"}</DialogTitle>
          <DialogDescription>هذه القيم تُستخدم كنقطة بداية لنطاق عمل كل مشروع يرتبط بالخدمة.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="svc-name">اسم الخدمة</Label>
              <Input id="svc-name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="svc-desc">وصف مختصر</Label>
              <Textarea id="svc-desc" rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>المخرجات</Label>
              <ListEditorStrings
                value={draft.deliverables}
                onChange={(v) => set("deliverables", v)}
                placeholder="مثال: شعار رئيسي"
                bulletClassName="bg-success"
              />
            </div>
            <div className="space-y-2">
              <Label>الاستثناءات</Label>
              <ListEditorStrings
                value={draft.exclusions}
                onChange={(v) => set("exclusions", v)}
                placeholder="مثال: الطباعة"
                bulletClassName="bg-destructive"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="svc-rev">جولات التعديل</Label>
              <Input
                id="svc-rev"
                type="number"
                min={0}
                value={draft.revision_limit}
                onChange={(e) => set("revision_limit", Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-days">مدة التسليم (أيام)</Label>
              <Input
                id="svc-days"
                type="number"
                min={1}
                value={draft.delivery_days}
                onChange={(e) => set("delivery_days", Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>نموذج التسعير</Label>
              <Select value={draft.pricing_model} onValueChange={(v) => set("pricing_model", v as PricingModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRICING_MODEL_LABEL) as PricingModel[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {PRICING_MODEL_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-price">السعر الأساسي ({currency})</Label>
              <Input
                id="svc-price"
                type="number"
                min={0}
                value={draft.base_price}
                onChange={(e) => set("base_price", Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-rules">قواعد التسعير</Label>
            <Textarea
              id="svc-rules"
              rows={3}
              value={draft.pricing_rules}
              onChange={(e) => set("pricing_rules", e.target.value)}
              placeholder="مثال: 50% مقدمًا، وكل جولة تعديل إضافية بـ 80 دولار."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <div className="text-sm font-medium">خدمة مفعّلة</div>
              <div className="text-xs text-muted-foreground">الخدمات المعطّلة لا تظهر عند إنشاء طلب جديد.</div>
            </div>
            <Switch checked={draft.is_active} onCheckedChange={(v) => set("is_active", v)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button onClick={submit}>{service ? "حفظ التعديلات" : "إضافة الخدمة"}</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
