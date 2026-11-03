import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, MoreHorizontal, Paperclip, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { DemoBadge, ProjectStatusBadge } from "@/components/common/status-badges";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActions, useAppData } from "@/data/store";
import { formatDate } from "@/lib/format";
import { PROJECT_STATUS_LABEL } from "@/lib/labels";
import { latestVersion } from "@/lib/scope";
import { SCOPE_STATUS_LABEL } from "@/lib/labels";
import type { ProjectStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => ({
    meta: [
      { title: "المشاريع — SCOPE" },
      { name: "description", content: "جميع مشاريعك مع حالة الطلب ونطاق العمل لكل مشروع." },
      { property: "og:title", content: "المشاريع — SCOPE" },
      { property: "og:description", content: "جميع مشاريعك مع حالة الطلب ونطاق العمل لكل مشروع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

type Filter = "all" | ProjectStatus;
const FILTERS: Filter[] = ["all", "pending", "needs_clarification", "in_progress", "completed"];

function ProjectsPage() {
  const { projects, services, scopeVersions } = useAppData();
  const { deleteProject } = useActions();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Filter>("all");
  const [serviceId, setServiceId] = useState("all");
  const [toDelete, setToDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...projects]
      .filter((p) => status === "all" || p.status === status)
      .filter((p) => serviceId === "all" || p.service_id === serviceId)
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.client_name.toLowerCase().includes(q))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [projects, query, status, serviceId]);

  const countFor = (f: Filter) => (f === "all" ? projects.length : projects.filter((p) => p.status === f).length);
  const deleting = projects.find((p) => p.id === toDelete);

  return (
    <div className="space-y-6">
      <PageHeader
        title="المشاريع"
        description="كل طلبات العملاء ومشاريعك في مكان واحد."
        actions={
          <Button asChild>
            <Link to="/requests/new">
              <Plus />
              طلب عميل جديد
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={status} onValueChange={(v) => setStatus(v as Filter)} className="overflow-x-auto">
          <TabsList className="h-auto">
            {FILTERS.map((f) => (
              <TabsTrigger key={f} value={f} className="gap-1.5 px-3 py-1.5">
                {f === "all" ? "الكل" : PROJECT_STATUS_LABEL[f]}
                <span className="num text-xs text-muted-foreground">{countFor(f)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم المشروع أو العميل"
              className="ps-9 sm:w-64"
            />
          </div>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الخدمات</SelectItem>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title="لا توجد مشاريع مطابقة"
          description="جرّب تغيير الفلاتر أو أضف طلب عميل جديد."
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="hidden grid-cols-12 gap-4 border-b bg-muted/40 px-5 py-3 text-xs font-medium text-muted-foreground md:grid">
            <div className="col-span-5">المشروع</div>
            <div className="col-span-2">الحالة</div>
            <div className="col-span-2">نطاق العمل</div>
            <div className="col-span-2">آخر تحديث</div>
            <div className="col-span-1" />
          </div>
          <ul className="divide-y">
            {filtered.map((p) => {
              const v = latestVersion(scopeVersions, p.id);
              const service = services.find((s) => s.id === p.service_id);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4 transition-colors hover:bg-muted/40 md:grid md:grid-cols-12 md:gap-4">
                  <Link to="/projects/$projectId" params={{ projectId: p.id }} className="w-full min-w-0 md:col-span-5 md:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground hover:text-primary">{p.title}</span>
                      {p.is_demo && <DemoBadge label="تجريبي" />}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted-foreground">
                      <span>{p.client_name}</span>
                      <span>·</span>
                      <span>{service?.name ?? "بدون خدمة"}</span>
                      {p.attachments.length > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <Paperclip className="size-3" />
                          <span className="num">{p.attachments.length}</span>
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="md:col-span-2">
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <div className="text-xs text-muted-foreground md:col-span-2">
                    {v ? `النسخة ${v.version_number} · ${SCOPE_STATUS_LABEL[v.status]}` : "لم يُنشأ بعد"}
                  </div>
                  <div className="num text-xs text-muted-foreground md:col-span-2">{formatDate(p.updated_at)}</div>
                  <div className="ms-auto flex justify-end md:col-span-1 md:ms-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="خيارات المشروع">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to="/projects/$projectId/analysis" params={{ projectId: p.id }}>
                            تحليل الطلب
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/projects/$projectId/scope" params={{ projectId: p.id }}>
                            نطاق العمل
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/projects/$projectId/changes" params={{ projectId: p.id }}>
                            كشف التغييرات
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setToDelete(p.id)}>
                          <Trash2 />
                          حذف المشروع
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المشروع؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف «{deleting?.title}» مع رسائله ونسخ نطاق العمل الخاصة به. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) deleteProject(toDelete);
                toast.success("تم حذف المشروع");
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
