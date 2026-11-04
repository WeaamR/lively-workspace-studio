/**
 * Supabase persistence for the app store.
 *
 * - `loadAppData` reads every table owned by the signed-in user (RLS scopes rows).
 * - `persistAction` mirrors one reducer action to the database.
 * Rows are always written with the authenticated user's id; the browser client
 * uses the publishable key only, so RLS is never bypassed.
 */
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type {
  AppData,
  ChangeAnalysis,
  ChangeClassification,
  MessageKind,
  PricingModel,
  Profile,
  Project,
  ProjectMessage,
  ProjectStatus,
  RequestAnalysis,
  ResultSource,
  ScopeCategory,
  ScopeItem,
  ScopeStatus,
  ScopeVersion,
  Service,
} from "@/lib/types";

import type { Action } from "./reducer";

// ---------- value mappings (app <-> database) ----------

export function projectStatusToDb(s: ProjectStatus): string {
  return s === "pending" ? "new" : s;
}
export function projectStatusFromDb(s: string): ProjectStatus {
  switch (s) {
    case "needs_clarification":
    case "scope_draft":
      return "needs_clarification";
    case "in_progress":
    case "approved":
      return "in_progress";
    case "completed":
    case "archived":
      return "completed";
    default:
      return "pending";
  }
}

/** The database only knows draft/approved/superseded; "sent" is kept as draft. */
export function scopeStatusToDb(s: ScopeStatus): "draft" | "approved" | "superseded" {
  return s === "pending_approval" ? "draft" : s;
}

export function categoryToDb(c: ScopeCategory): string | null {
  if (c === "open_item") return "unresolved";
  if (c === "condition") return null; // not an allowed category in scope_items
  return c;
}
export function categoryFromDb(c: string): ScopeCategory {
  return c === "unresolved" ? "open_item" : (c as ScopeCategory);
}

export function pricingToDb(p: PricingModel): string {
  return p === "package" ? "custom" : p;
}

/** Unconfirmed dates never reach delivery_deadline; the pending question lives in delivery_condition. */
export function versionToDb(v: ScopeVersion, userId: string) {
  const pending = v.deadline_status === "pending_clarification";
  return {
    id: v.id,
    project_id: v.project_id,
    user_id: userId,
    version_number: v.version_number,
    status: scopeStatusToDb(v.status),
    revision_rounds: v.revision_rounds,
    delivery_deadline: pending ? null : v.delivery_deadline,
    delivery_condition: pending ? v.deadline_note || "موعد التسليم بانتظار تأكيد العميل" : null,
    terms: v.notes || null,
    approved_at: v.approved_at,
  };
}

export function overallClassification(items: { classification: ChangeClassification }[]): string {
  const set = new Set(items.map((i) => i.classification));
  if (set.size === 0) return "needs_clarification";
  if (set.size === 1) return [...set][0] as string;
  return "mixed";
}

const sourceFromModel = (m: string | null): ResultSource => (m === "demo-rules" ? "demo" : m === "manual" ? "manual" : "ai");
const modelFromSource = (s: ResultSource) => (s === "demo" ? "demo-rules" : s === "manual" ? "manual" : "ai");
const KINDS: MessageKind[] = ["original_request", "message", "change_request"];
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

interface Meta {
  phone?: string;
  location?: string;
  years_experience?: number;
  currency?: string;
  service_extras?: Record<string, { inclusions?: string[]; pricing_rules?: string }>;
}

function check<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new Error(res.error.message);
  return res;
}

// ---------- load ----------

export async function loadAppData(user: User): Promise<AppData> {
  const meta = (user.user_metadata ?? {}) as Meta;
  const [prof, svc, prj, msg, ana, ver, itm, rev] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("services").select("*").order("created_at"),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("project_messages").select("*").order("created_at"),
    supabase.from("request_analyses").select("*").order("created_at"),
    supabase.from("scope_versions").select("*").order("version_number"),
    supabase.from("scope_items").select("*").order("sort_order"),
    supabase.from("change_reviews").select("*").order("created_at"),
  ]);
  [prof, svc, prj, msg, ana, ver, itm, rev].forEach(check);

  let p = prof.data;
  if (!p) {
    // Trigger normally creates it; make sure the row exists for this user.
    const ins = check(
      await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email ?? null, full_name: (user.user_metadata?.["full_name"] as string) ?? null })
        .select("*")
        .single(),
    );
    p = ins.data;
  }

  const profile: Profile = {
    id: user.id,
    email: p?.email ?? user.email ?? "",
    full_name: p?.full_name ?? "",
    specialty: p?.specialty ?? "",
    bio: p?.bio ?? "",
    phone: meta.phone ?? "",
    location: meta.location ?? "",
    years_experience: meta.years_experience ?? 0,
    currency: meta.currency ?? "USD",
  };

  const extras = meta.service_extras ?? {};
  const services: Service[] = (svc.data ?? []).map((s) => ({
    id: s.id,
    user_id: s.user_id,
    name: s.name,
    description: s.description ?? "",
    deliverables: arr(s.deliverables),
    exclusions: arr(s.exclusions),
    inclusions: extras[s.id]?.inclusions ?? [],
    pricing_rules: extras[s.id]?.pricing_rules ?? "",
    revision_limit: s.revision_rounds,
    delivery_days: s.estimated_days ?? 0,
    pricing_model: (s.pricing_model === "custom" ? "package" : s.pricing_model ?? "fixed") as PricingModel,
    base_price: Number(s.base_price ?? 0),
    is_active: s.is_active ?? true,
    created_at: s.created_at ?? "",
  }));

  const latestAnalysis = new Map<string, RequestAnalysis>();
  for (const a of ana.data ?? []) {
    latestAnalysis.set(a.project_id, {
      confirmed: arr(a.confirmed_facts),
      missing: arr(a.missing_information),
      ambiguous: arr(a.ambiguities),
      risks: arr(a.risks),
      questions: arr(a.suggested_questions),
      client_message: a.suggested_client_message ?? "",
      source: sourceFromModel(a.model_name),
      updated_at: a.created_at ?? "",
    });
  }

  const projects: Project[] = (prj.data ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    service_id: r.service_id,
    title: r.title,
    client_name: r.client_name ?? "",
    status: projectStatusFromDb(r.status),
    original_request: r.original_request ?? "",
    attachments: [],
    analysis: latestAnalysis.get(r.id) ?? null,
    created_at: r.created_at ?? "",
    updated_at: r.updated_at ?? "",
    is_demo: false,
  }));

  const reviews = new Map<string, ChangeAnalysis>();
  for (const r of rev.data ?? []) {
    if (!r.message_id) continue;
    const findings = (Array.isArray(r.findings) ? r.findings : []) as Array<Record<string, unknown>>;
    reviews.set(r.message_id, {
      scope_version_id: r.scope_version_id,
      items: findings.map((f) => ({
        id: String(f["id"] ?? crypto.randomUUID()),
        request_text: String(f["request_text"] ?? ""),
        classification: (f["classification"] as ChangeClassification) ?? "needs_clarification",
        scope_item_id: (f["scope_item_id"] as string) ?? null,
        note: String(f["note"] ?? ""),
      })),
      suggested_response: r.suggested_response ?? "",
      source: (findings[0]?.["source"] as ResultSource) ?? "demo",
      created_at: r.created_at ?? "",
    });
  }

  const messages: ProjectMessage[] = (msg.data ?? []).map((m) => ({
    id: m.id,
    project_id: m.project_id,
    author: m.sender_role === "client" ? "client" : "freelancer",
    kind: KINDS.includes(m.source as MessageKind) ? (m.source as MessageKind) : "message",
    content: m.message,
    created_at: m.created_at ?? "",
    change_analysis: reviews.get(m.id) ?? null,
  }));

  const scopeVersions: ScopeVersion[] = (ver.data ?? []).map((v) => ({
    id: v.id,
    project_id: v.project_id,
    version_number: v.version_number,
    status: v.status as ScopeStatus,
    delivery_deadline: v.delivery_deadline,
    revision_rounds: v.revision_rounds ?? 2,
    deadline_status: v.delivery_condition && !v.delivery_deadline ? "pending_clarification" : v.delivery_deadline ? "confirmed" : undefined,
    deadline_note: v.delivery_condition ?? undefined,
    notes: v.terms ?? "",
    created_at: v.created_at ?? "",
    sent_at: null,
    approved_at: v.approved_at,
  }));

  const scopeItems: ScopeItem[] = (itm.data ?? []).map((i) => ({
    id: i.id,
    scope_version_id: i.scope_version_id,
    category: categoryFromDb(i.category),
    content: i.title,
    position: i.sort_order ?? 0,
  }));

  return { profile, services, projects, messages, scopeVersions, scopeItems };
}

// ---------- write ----------

function itemRows(items: ScopeItem[], userId: string) {
  return items.flatMap((i) => {
    const category = categoryToDb(i.category);
    return category
      ? [{ id: i.id, scope_version_id: i.scope_version_id, user_id: userId, category, title: i.content, sort_order: i.position }]
      : [];
  });
}

async function insertAnalysis(projectId: string, a: RequestAnalysis, userId: string) {
  check(
    await supabase.from("request_analyses").insert({
      project_id: projectId,
      user_id: userId,
      analysis_status: "completed",
      model_name: modelFromSource(a.source),
      confirmed_facts: a.confirmed,
      missing_information: a.missing,
      ambiguities: a.ambiguous,
      risks: a.risks,
      suggested_questions: a.questions,
      suggested_client_message: a.client_message,
      raw_result: { source: a.source },
    }),
  );
}

async function insertReview(m: ProjectMessage, ca: ChangeAnalysis, userId: string) {
  check(
    await supabase.from("change_reviews").insert({
      project_id: m.project_id,
      scope_version_id: ca.scope_version_id,
      user_id: userId,
      message_id: m.id,
      client_message: m.content,
      classification: overallClassification(ca.items),
      findings: ca.items.map((i) => ({ ...i, source: ca.source })),
      suggested_response: ca.suggested_response,
    }),
  );
}

async function updateMeta(patch: Partial<Meta>) {
  check(await supabase.auth.updateUser({ data: patch }));
}

export async function persistAction(action: Action, prev: AppData, next: AppData, userId: string): Promise<void> {
  switch (action.type) {
    case "data/replace":
      return;

    case "profile/update": {
      const p = next.profile;
      check(
        await supabase
          .from("profiles")
          .upsert({ id: userId, email: p.email || null, full_name: p.full_name, specialty: p.specialty, bio: p.bio }),
      );
      await updateMeta({ phone: p.phone, location: p.location, years_experience: p.years_experience, currency: p.currency });
      return;
    }

    case "service/upsert": {
      const s = action.service;
      check(
        await supabase.from("services").upsert({
          id: s.id,
          user_id: userId,
          name: s.name,
          description: s.description,
          deliverables: s.deliverables,
          exclusions: s.exclusions,
          revision_rounds: s.revision_limit,
          estimated_days: s.delivery_days,
          pricing_model: pricingToDb(s.pricing_model),
          base_price: s.base_price,
          currency: next.profile.currency || "USD",
          is_active: s.is_active,
        }),
      );
      const { data } = await supabase.auth.getUser();
      const extras = { ...((data.user?.user_metadata as Meta)?.service_extras ?? {}) };
      extras[s.id] = { inclusions: s.inclusions ?? [], pricing_rules: s.pricing_rules };
      await updateMeta({ service_extras: extras });
      return;
    }

    case "service/delete":
      check(await supabase.from("projects").update({ service_id: null }).eq("service_id", action.id));
      check(await supabase.from("services").delete().eq("id", action.id));
      return;

    case "project/create": {
      const p = action.project;
      check(
        await supabase.from("projects").insert({
          id: p.id,
          user_id: userId,
          service_id: p.service_id,
          title: p.title,
          client_name: p.client_name,
          original_request: p.original_request,
          status: projectStatusToDb(p.status),
        }),
      );
      await persistAction({ type: "message/add", message: action.message }, prev, next, userId);
      return;
    }

    case "project/update": {
      const p = next.projects.find((x) => x.id === action.id);
      if (!p) return;
      const { analysis, ...rest } = action.patch;
      if (Object.keys(rest).length) {
        check(
          await supabase
            .from("projects")
            .update({
              title: p.title,
              client_name: p.client_name,
              service_id: p.service_id,
              original_request: p.original_request,
              status: projectStatusToDb(p.status),
            })
            .eq("id", p.id),
        );
      }
      if ("analysis" in action.patch) {
        if (analysis) await insertAnalysis(p.id, analysis, userId);
        else check(await supabase.from("request_analyses").delete().eq("project_id", p.id));
      }
      return;
    }

    case "project/delete": {
      const id = action.id;
      for (const t of ["change_reviews", "request_analyses"] as const) {
        check(await supabase.from(t).delete().eq("project_id", id));
      }
      const versionIds = prev.scopeVersions.filter((v) => v.project_id === id).map((v) => v.id);
      if (versionIds.length) check(await supabase.from("scope_items").delete().in("scope_version_id", versionIds));
      check(await supabase.from("scope_versions").delete().eq("project_id", id));
      check(await supabase.from("project_messages").delete().eq("project_id", id));
      check(await supabase.from("projects").delete().eq("id", id));
      return;
    }

    case "message/add": {
      const m = action.message;
      check(
        await supabase.from("project_messages").insert({
          id: m.id,
          project_id: m.project_id,
          user_id: userId,
          sender_role: m.author,
          message: m.content,
          source: m.kind,
        }),
      );
      if (m.change_analysis) await insertReview(m, m.change_analysis, userId);
      return;
    }

    case "message/update": {
      const m = next.messages.find((x) => x.id === action.id);
      if (!m || !("change_analysis" in action.patch)) return;
      check(await supabase.from("change_reviews").delete().eq("message_id", m.id));
      if (m.change_analysis) await insertReview(m, m.change_analysis, userId);
      return;
    }

    case "scope/create": {
      if (next.scopeVersions.length === prev.scopeVersions.length) return; // rejected by reducer
      // Supersede the previous unapproved working draft, if any.
      const sup = action.supersedeId ? prev.scopeVersions.find((v) => v.id === action.supersedeId) : null;
      if (sup && !sup.approved_at && (sup.status === "draft" || sup.status === "pending_approval")) {
        check(await supabase.from("scope_versions").update({ status: "superseded" }).eq("id", sup.id).is("approved_at", null));
      }
      check(await supabase.from("scope_versions").insert(versionToDb(action.version, userId)));
      if (action.items.length) check(await supabase.from("scope_items").insert(itemRows(action.items, userId)));
      return;
    }

    case "scope/update": {
      const v = next.scopeVersions.find((x) => x.id === action.id);
      if (!v || v === prev.scopeVersions.find((x) => x.id === action.id)) return;
      const { id: _id, user_id: _u, project_id: _p, ...row } = versionToDb(v, userId);
      check(await supabase.from("scope_versions").update(row).eq("id", v.id));
      return;
    }

    case "scope/saveDraft":
      return; // draft fields/items are already persisted by their own actions

    case "scope/send":
    case "scope/revertToDraft":
      return; // no "sent" status in scope_versions; stays a draft in the database

    case "scope/approve": {
      const target = next.scopeVersions.find((v) => v.id === action.id);
      if (!target || target.status !== "approved") return;
      const superseded = next.scopeVersions.filter(
        (v) => v.project_id === target.project_id && v.status === "superseded" && prev.scopeVersions.find((p) => p.id === v.id)?.status === "approved",
      );
      for (const v of superseded) check(await supabase.from("scope_versions").update({ status: "superseded" }).eq("id", v.id));
      check(await supabase.from("scope_versions").update({ status: "approved", approved_at: target.approved_at }).eq("id", target.id));
      const p = next.projects.find((x) => x.id === target.project_id);
      if (p) check(await supabase.from("projects").update({ status: projectStatusToDb(p.status) }).eq("id", p.id));
      return;
    }

    case "scope/delete": {
      if (next.scopeVersions.some((v) => v.id === action.id)) return; // rejected by reducer
      // Remove items explicitly (works with or without ON DELETE CASCADE), then the
      // version row — guarded so only never-approved drafts/superseded rows go.
      check(await supabase.from("scope_items").delete().eq("scope_version_id", action.id));
      check(
        await supabase
          .from("scope_versions")
          .delete()
          .eq("id", action.id)
          .is("approved_at", null)
          .in("status", ["draft", "superseded"]),
      );
      return;
    }

    case "scopeItem/add": {
      const rows = itemRows([action.item], userId);
      if (rows.length && next.scopeItems.length > prev.scopeItems.length) check(await supabase.from("scope_items").insert(rows));
      return;
    }

    case "scopeItem/update": {
      const it = next.scopeItems.find((i) => i.id === action.id);
      if (it && it !== prev.scopeItems.find((i) => i.id === action.id))
        check(await supabase.from("scope_items").update({ title: it.content }).eq("id", it.id));
      return;
    }

    case "scopeItem/remove":
      if (next.scopeItems.length < prev.scopeItems.length) check(await supabase.from("scope_items").delete().eq("id", action.id));
      return;
  }
}
