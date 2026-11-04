/**
 * Pure state transitions for the local (phase 1) store.
 * Each action maps 1:1 to a future Supabase mutation.
 */
import { repairScopeData } from "@/lib/scope";
import type {
  AppData,
  Profile,
  Project,
  ProjectMessage,
  ScopeItem,
  ScopeVersion,
  Service,
} from "@/lib/types";

export type Action =
  | { type: "data/replace"; data: AppData }
  | { type: "profile/update"; patch: Partial<Profile> }
  | { type: "service/upsert"; service: Service }
  | { type: "service/delete"; id: string }
  | { type: "project/create"; project: Project; message: ProjectMessage }
  | { type: "project/update"; id: string; patch: Partial<Project>; at: string }
  | { type: "project/delete"; id: string }
  | { type: "message/add"; message: ProjectMessage }
  | { type: "message/update"; id: string; patch: Partial<ProjectMessage> }
  | { type: "scope/create"; version: ScopeVersion; items: ScopeItem[]; supersedeId?: string | undefined }
  | { type: "scope/update"; id: string; patch: Partial<Pick<ScopeVersion, "delivery_deadline" | "revision_rounds" | "notes" | "deadline_status" | "deadline_note">> }
  | { type: "scope/saveDraft"; id: string }
  | { type: "scope/send"; id: string; at: string }
  | { type: "scope/revertToDraft"; id: string }
  | { type: "scope/approve"; id: string; at: string }
  | { type: "scope/delete"; id: string }
  | { type: "scopeItem/add"; item: ScopeItem }
  | { type: "scopeItem/update"; id: string; content: string }
  | { type: "scopeItem/remove"; id: string };

function isDraft(state: AppData, versionId: string): boolean {
  return state.scopeVersions.find((v) => v.id === versionId)?.status === "draft";
}

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case "data/replace":
      return repairScopeData(action.data);

    case "profile/update":
      return { ...state, profile: { ...state.profile, ...action.patch } };

    case "service/upsert": {
      const exists = state.services.some((s) => s.id === action.service.id);
      return {
        ...state,
        services: exists
          ? state.services.map((s) => (s.id === action.service.id ? action.service : s))
          : [...state.services, action.service],
      };
    }

    case "service/delete":
      return {
        ...state,
        services: state.services.filter((s) => s.id !== action.id),
        projects: state.projects.map((p) => (p.service_id === action.id ? { ...p, service_id: null } : p)),
      };

    case "project/create":
      return {
        ...state,
        projects: [action.project, ...state.projects],
        messages: [...state.messages, action.message],
      };

    case "project/update":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id ? { ...p, ...action.patch, updated_at: action.at } : p,
        ),
      };

    case "project/delete": {
      const versionIds = new Set(state.scopeVersions.filter((v) => v.project_id === action.id).map((v) => v.id));
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.id),
        messages: state.messages.filter((m) => m.project_id !== action.id),
        scopeVersions: state.scopeVersions.filter((v) => v.project_id !== action.id),
        scopeItems: state.scopeItems.filter((i) => !versionIds.has(i.scope_version_id)),
      };
    }

    case "message/add":
      return { ...state, messages: [...state.messages, action.message] };

    case "message/update":
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)),
      };

    case "scope/create": {
      // A new draft supersedes a previous unapproved working draft only;
      // an approved version stays approved until the new one is approved.
      const sup = action.supersedeId ? state.scopeVersions.find((v) => v.id === action.supersedeId) : null;
      const supersede = sup && !sup.approved_at && (sup.status === "draft" || sup.status === "pending_approval");
      return {
        ...state,
        scopeVersions: [
          ...state.scopeVersions.map((v) => (supersede && v.id === sup!.id ? { ...v, status: "superseded" as const } : v)),
          action.version,
        ],
        scopeItems: [...state.scopeItems, ...action.items],
      };
    }

    case "scope/update":
      if (!isDraft(state, action.id)) return state;
      return {
        ...state,
        scopeVersions: state.scopeVersions.map((v) => (v.id === action.id ? { ...v, ...action.patch } : v)),
      };

    case "scope/saveDraft":
      // Saving a draft updates the same record; fields and items are already
      // persisted by their own actions, so no state change happens here.
      if (!isDraft(state, action.id)) return state;
      return state;

    case "scope/send":
      return {
        ...state,
        scopeVersions: state.scopeVersions.map((v) =>
          v.id === action.id && v.status === "draft" ? { ...v, status: "pending_approval", sent_at: action.at } : v,
        ),
      };

    case "scope/revertToDraft":
      return {
        ...state,
        scopeVersions: state.scopeVersions.map((v) =>
          v.id === action.id && v.status === "pending_approval" ? { ...v, status: "draft", sent_at: null } : v,
        ),
      };

    case "scope/approve": {
      const target = state.scopeVersions.find((v) => v.id === action.id);
      if (!target || target.status === "approved" || target.status === "superseded") return state;
      return {
        ...state,
        scopeVersions: state.scopeVersions.map((v) => {
          if (v.id === action.id) return { ...v, status: "approved", approved_at: action.at, sent_at: v.sent_at ?? action.at };
          if (v.project_id === target.project_id && v.status === "approved") return { ...v, status: "superseded" };
          return v;
        }),
        projects: state.projects.map((p) =>
          p.id === target.project_id
            ? {
                ...p,
                status: p.status === "completed" ? p.status : "in_progress",
                updated_at: action.at,
              }
            : p,
        ),
      };
    }

    case "scope/delete": {
      // Deletable: drafts and superseded versions that were never approved.
      // Anything with approved_at set, or currently approved/sent, is immutable history.
      const target = state.scopeVersions.find((v) => v.id === action.id);
      if (!target || target.approved_at) return state;
      if (target.status !== "draft" && target.status !== "superseded") return state;
      return {
        ...state,
        scopeVersions: state.scopeVersions.filter((v) => v.id !== action.id),
        scopeItems: state.scopeItems.filter((i) => i.scope_version_id !== action.id),
      };
    }

    case "scopeItem/add":
      if (!isDraft(state, action.item.scope_version_id)) return state;
      return { ...state, scopeItems: [...state.scopeItems, action.item] };

    case "scopeItem/update": {
      const item = state.scopeItems.find((i) => i.id === action.id);
      if (!item || !isDraft(state, item.scope_version_id)) return state;
      return {
        ...state,
        scopeItems: state.scopeItems.map((i) => (i.id === action.id ? { ...i, content: action.content } : i)),
      };
    }

    case "scopeItem/remove": {
      const item = state.scopeItems.find((i) => i.id === action.id);
      if (!item || !isDraft(state, item.scope_version_id)) return state;
      return { ...state, scopeItems: state.scopeItems.filter((i) => i.id !== action.id) };
    }

    default:
      return state;
  }
}
