import type { AppData } from "./types";

export type ActivityType =
  | "request"
  | "client_message"
  | "freelancer_message"
  | "change_request"
  | "scope_created"
  | "scope_sent"
  | "scope_approved";

export interface ActivityEvent {
  id: string;
  project_id: string;
  project_title: string;
  type: ActivityType;
  at: string;
  title: string;
  detail?: string;
}

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  request: "طلب جديد",
  client_message: "رسالة من العميل",
  freelancer_message: "رسالة مرسلة",
  change_request: "طلب تغيير",
  scope_created: "نسخة نطاق جديدة",
  scope_sent: "إرسال النطاق للموافقة",
  scope_approved: "اعتماد النطاق",
};

/** Derives a chronological event stream from stored records (newest first). */
export function buildActivity(data: AppData, projectId?: string): ActivityEvent[] {
  const titles = new Map(data.projects.map((p) => [p.id, p.title]));
  const events: ActivityEvent[] = [];

  for (const m of data.messages) {
    if (projectId && m.project_id !== projectId) continue;
    if (!titles.has(m.project_id)) continue;
    const type: ActivityType =
      m.kind === "original_request"
        ? "request"
        : m.kind === "change_request"
          ? "change_request"
          : m.author === "client"
            ? "client_message"
            : "freelancer_message";
    events.push({
      id: `m-${m.id}`,
      project_id: m.project_id,
      project_title: titles.get(m.project_id)!,
      type,
      at: m.created_at,
      title: ACTIVITY_LABEL[type],
      detail: m.content,
    });
  }

  for (const v of data.scopeVersions) {
    if (projectId && v.project_id !== projectId) continue;
    if (!titles.has(v.project_id)) continue;
    const base = { project_id: v.project_id, project_title: titles.get(v.project_id)! };
    events.push({
      ...base,
      id: `v-${v.id}-c`,
      type: "scope_created",
      at: v.created_at,
      title: `${ACTIVITY_LABEL.scope_created} (النسخة ${v.version_number})`,
    });
    if (v.sent_at)
      events.push({
        ...base,
        id: `v-${v.id}-s`,
        type: "scope_sent",
        at: v.sent_at,
        title: `${ACTIVITY_LABEL.scope_sent} (النسخة ${v.version_number})`,
      });
    if (v.approved_at)
      events.push({
        ...base,
        id: `v-${v.id}-a`,
        type: "scope_approved",
        at: v.approved_at,
        title: `${ACTIVITY_LABEL.scope_approved} (النسخة ${v.version_number})`,
      });
  }

  return events.sort((a, b) => b.at.localeCompare(a.at));
}
