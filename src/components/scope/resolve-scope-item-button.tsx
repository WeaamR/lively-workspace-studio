
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useDataStatus } from "@/data/store";
import {
  resolveScopeItem,
  type ScopeResolutionCategory,
} from "@/lib/scope-api";

interface Props {
  itemId: string;
  itemContent: string;
}

export function ResolveScopeItemButton({
  itemId,
  itemContent,
}: Props) {
  const { reload } = useDataStatus();

  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [category, setCategory] =
    useState<ScopeResolutionCategory | "">("");
  const [title, setTitle] = useState(itemContent);
  const [description, setDescription] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleOpen() {
    setAnswer("");
    setCategory("");
    setTitle(itemContent);
    setDescription("");
    setConfirmed(false);
    setOpen(true);
  }

  async function handleResolve() {
    if (
      !answer.trim() ||
      !category ||
      !title.trim() ||
      !confirmed
    ) {
      toast.error("يرجى استكمال البيانات وتأكيد المراجعة.");
      return;
    }

    setSaving(true);

    try {
      const result = await resolveScopeItem({
        item_id: itemId,
        answer: answer.trim(),
        resolved_category: category,
        resolved_title: title.trim(),
        resolved_description:
          description.trim() || answer.trim(),
        confirmed_by_freelancer: true,
      });

      toast.success(
        result.message || "تم حسم البند بنجاح."
      );

      setOpen(false);

      // Reload the actual database state after RPC succeeds.
      reload();

    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر حسم البند."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 shrink-0 px-2 text-xs"
        onClick={handleOpen}
      >
        <CheckCircle2 />
        حسم البند
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!saving) setOpen(nextOpen);
        }}
      >
        <DialogContent
          dir="rtl"
          className="sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle>
              حسم بند من نطاق العمل
            </DialogTitle>

            <DialogDescription>
              راجع الإجابة وحدد التصنيف الصحيح قبل
              تحديث مسودة الاتفاق.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>البند غير المحسوم</Label>
              <div className="rounded-md border bg-muted/40 p-3 text-sm leading-relaxed">
                {itemContent}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`answer-${itemId}`}>
                الإجابة أو المعلومة المؤكدة
              </Label>

              <Textarea
                id={`answer-${itemId}`}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="أدخل الإجابة التي راجعتها..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>التصنيف بعد الحسم</Label>

              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as ScopeResolutionCategory)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر تصنيف البند" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="deliverable">
                    مخرج من مخرجات المشروع
                  </SelectItem>

                  <SelectItem value="included">
                    خدمة مشمولة
                  </SelectItem>

                  <SelectItem value="excluded">
                    خدمة مستثناة
                  </SelectItem>

                  <SelectItem value="client_responsibility">
                    مسؤولية العميل
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`title-${itemId}`}>
                العنوان المعتمد
              </Label>

              <Input
                id={`title-${itemId}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان البند بعد الحسم"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`description-${itemId}`}>
                وصف البند
              </Label>

              <Textarea
                id={`description-${itemId}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="تفاصيل إضافية (اختياري)"
                rows={2}
              />
            </div>

            <div className="flex items-start gap-2 rounded-md border p-3">
              <Checkbox
                id={`confirm-${itemId}`}
                checked={confirmed}
                onCheckedChange={(value) =>
                  setConfirmed(value === true)
                }
              />

              <Label
                htmlFor={`confirm-${itemId}`}
                className="cursor-pointer text-sm leading-relaxed"
              >
                أؤكد أنني راجعت الإجابة والتصنيف،
                وأوافق على تحديث مسودة نطاق العمل.
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>

            <Button
              type="button"
              disabled={
                saving ||
                !answer.trim() ||
                !category ||
                !title.trim() ||
                !confirmed
              }
              onClick={handleResolve}
            >
              {saving ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCircle2 />
              )}

              {saving ? "جارٍ الحفظ..." : "تأكيد حسم البند"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
