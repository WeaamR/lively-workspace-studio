import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useMemo, useState } from "react";

import { ActivityList } from "@/components/common/activity-list";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/data/store";
import { ACTIVITY_LABEL, buildActivity, type ActivityType } from "@/lib/activity";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "سجل المشاريع — SCOPE" },
      { name: "description", content: "كل الطلبات والرسائل ونسخ النطاق والموافقات عبر مشاريعك." },
      { property: "og:title", content: "سجل المشاريع — SCOPE" },
      { property: "og:description", content: "كل الطلبات والرسائل ونسخ النطاق والموافقات عبر مشاريعك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const data = useAppData();
  const [projectId, setProjectId] = useState("all");
  const [type, setType] = useState<"all" | ActivityType>("all");

  const events = useMemo(
    () =>
      buildActivity(data, projectId === "all" ? undefined : projectId).filter((e) => type === "all" || e.type === type),
    [data, projectId, type],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل المشاريع"
        description="الطلبات الأصلية والرسائل ونسخ النطاق وتواريخ الموافقة عبر كل مشاريعك."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="sm:w-60" aria-label="المشروع">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المشاريع</SelectItem>
                {data.projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="sm:w-48" aria-label="نوع النشاط">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنشطة</SelectItem>
                {(Object.keys(ACTIVITY_LABEL) as ActivityType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {ACTIVITY_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      {events.length === 0 ? (
        <EmptyState icon={<History />} title="لا توجد أنشطة مطابقة" description="غيّر الفلاتر لعرض أنشطة أخرى." />
      ) : (
        <section className="surface-card p-5 sm:p-6">
          <ActivityList events={events} showDetail />
        </section>
      )}
    </div>
  );
}
