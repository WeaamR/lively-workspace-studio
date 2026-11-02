import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ListEditorItem {
  id: string;
  content: string;
  /** Optional prefix such as a clause number. */
  marker?: ReactNode;
}

/**
 * Editable list of short text items (add / inline edit / remove).
 * Works with plain string arrays via `ListEditorStrings`, or with id-based rows.
 */
export function ListEditor({
  items,
  onAdd,
  onUpdate,
  onRemove,
  placeholder = "أضف عنصرًا…",
  emptyText = "لا توجد عناصر بعد.",
  readOnly = false,
  bulletClassName,
}: {
  items: ListEditorItem[];
  onAdd: (content: string) => void;
  onUpdate: (id: string, content: string) => void;
  onRemove: (id: string) => void;
  placeholder?: string;
  emptyText?: string;
  readOnly?: boolean;
  bulletClassName?: string;
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const submit = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) onUpdate(editingId, editValue.trim());
    setEditingId(null);
  };

  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="py-1 text-sm text-muted-foreground">{emptyText}</p>}
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60"
          >
            {item.marker ?? (
              <span className={cn("mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50", bulletClassName)} />
            )}
            {editingId === item.id ? (
              <div className="flex flex-1 items-center gap-1.5">
                <Input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-8"
                />
                <Button size="icon" variant="ghost" className="size-8" onClick={saveEdit} aria-label="حفظ">
                  <Check />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={() => setEditingId(null)}
                  aria-label="إلغاء"
                >
                  <X />
                </Button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm leading-relaxed text-foreground">{item.content}</span>
                {!readOnly && (
                  <div className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditValue(item.content);
                      }}
                      aria-label="تعديل"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(item.id)}
                      aria-label="حذف"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder}
            className="h-9"
          />
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={submit} disabled={!draft.trim()}>
            <Plus />
            إضافة
          </Button>
        </div>
      )}
    </div>
  );
}

/** Convenience wrapper for string[] values (index-based ids). */
export function ListEditorStrings({
  value,
  onChange,
  ...rest
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  readOnly?: boolean;
  bulletClassName?: string;
}) {
  return (
    <ListEditor
      {...rest}
      items={value.map((content, i) => ({ id: String(i), content }))}
      onAdd={(c) => onChange([...value, c])}
      onUpdate={(id, c) => onChange(value.map((v, i) => (String(i) === id ? c : v)))}
      onRemove={(id) => onChange(value.filter((_, i) => String(i) !== id))}
    />
  );
}
