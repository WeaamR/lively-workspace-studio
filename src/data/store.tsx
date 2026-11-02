/**
 * App data provider (phase 1: in-memory, seeded with demo data).
 *
 * Components only use `useAppData()` / `useActions()`. In phase 2 the
 * internals are swapped for Supabase + TanStack Query; the hook surface stays.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";

import { newId, nowIso } from "@/lib/format";
import { detectWeekdayDeadline, latestVersion } from "@/lib/scope";
import type {
  AppData,
  Attachment,
  ChangeAnalysis,
  MessageAuthor,
  MessageKind,
  Profile,
  Project,
  RequestAnalysis,
  ScopeCategory,
  ScopeItem,
  ScopeVersion,
  Service,
} from "@/lib/types";
import { emitAutomationEvent } from "@/services/automation";

import { DEMO_USER_ID, initialData } from "./mock-data";
import { reducer } from "./reducer";

/** Phase 1 persistence; replaced by Lovable Cloud in phase 2. */
export const STORAGE_KEY = "scope-demo-data-v1";

export interface NewProjectInput {
  title: string;
  client_name: string;
  service_id: string | null;
  original_request: string;
  attachments: Attachment[];
}

function useCreateActions(dispatch: React.Dispatch<Parameters<typeof reducer>[1]>, state: AppData) {
  return useMemo(
    () => ({
      resetDemoData() {
        dispatch({ type: "data/replace", data: structuredClone(initialData) });
      },

      updateProfile(patch: Partial<Profile>) {
        dispatch({ type: "profile/update", patch });
      },

      saveService(service: Omit<Service, "id" | "user_id" | "created_at"> & { id?: string }) {
        const existing = service.id ? state.services.find((s) => s.id === service.id) : undefined;
        const full: Service = {
          ...service,
          id: existing?.id ?? newId(),
          user_id: DEMO_USER_ID,
          created_at: existing?.created_at ?? nowIso(),
        };
        dispatch({ type: "service/upsert", service: full });
        return full.id;
      },

      deleteService(id: string) {
        dispatch({ type: "service/delete", id });
      },

      createProject(input: NewProjectInput) {
        const at = nowIso();
        const id = newId();
        const project: Project = {
          id,
          user_id: DEMO_USER_ID,
          service_id: input.service_id,
          title: input.title.trim(),
          client_name: input.client_name.trim(),
          status: "pending",
          original_request: input.original_request.trim(),
          attachments: input.attachments,
          analysis: null,
          created_at: at,
          updated_at: at,
          is_demo: false,
        };
        dispatch({
          type: "project/create",
          project,
          message: {
            id: newId(),
            project_id: id,
            author: "client",
            kind: "original_request",
            content: project.original_request,
            created_at: at,
            change_analysis: null,
          },
        });
        emitAutomationEvent({ type: "project.created", projectId: id });
        return id;
      },

      updateProject(id: string, patch: Partial<Project>) {
        dispatch({ type: "project/update", id, patch, at: nowIso() });
      },

      deleteProject(id: string) {
        dispatch({ type: "project/delete", id });
      },

      saveAnalysis(projectId: string, analysis: Omit<RequestAnalysis, "updated_at">) {
        dispatch({
          type: "project/update",
          id: projectId,
          patch: { analysis: { ...analysis, updated_at: nowIso() } },
          at: nowIso(),
        });
        emitAutomationEvent({ type: "analysis.saved", projectId });
      },

      addMessage(input: {
        project_id: string;
        author: MessageAuthor;
        kind: MessageKind;
        content: string;
        change_analysis?: ChangeAnalysis | null;
      }) {
        const id = newId();
        dispatch({
          type: "message/add",
          message: { ...input, id, created_at: nowIso(), change_analysis: input.change_analysis ?? null },
        });
        if (input.kind === "change_request") {
          emitAutomationEvent({ type: "change.recorded", projectId: input.project_id, messageId: id });
        }
        return id;
      },

      setChangeAnalysis(messageId: string, change_analysis: ChangeAnalysis | null) {
        dispatch({ type: "message/update", id: messageId, patch: { change_analysis } });
      },

      /** New draft version, copied from the latest version or seeded from the project's service. */
      createScopeVersion(projectId: string) {
        const project = state.projects.find((p) => p.id === projectId);
        const prev = latestVersion(state.scopeVersions, projectId);
        const service = state.services.find((s) => s.id === project?.service_id);
        const versionId = newId();
        const at = nowIso();
        const version: ScopeVersion = {
          id: versionId,
          project_id: projectId,
          version_number: (prev?.version_number ?? 0) + 1,
          status: "draft",
          delivery_deadline: prev?.delivery_deadline ?? null,
          revision_rounds: prev?.revision_rounds ?? service?.revision_limit ?? 2,
          deadline_status: prev?.deadline_status,
          deadline_note: prev?.deadline_note,
          notes: "",
          created_at: at,
          sent_at: null,
          approved_at: null,
        };
        let items: ScopeItem[];
        if (prev) {
          items = state.scopeItems
            .filter((i) => i.scope_version_id === prev.id)
            .map((i) => ({ ...i, id: newId(), scope_version_id: versionId }));
        } else {
          // Only terms explicitly defined by the service profile or the client's own words.
          const pendingDate = project ? detectWeekdayDeadline(project.original_request, project.created_at) : null;
          if (pendingDate) {
            version.deadline_status = "pending_clarification";
            version.deadline_note = pendingDate.question;
          }
          const openItems = [
            ...(pendingDate ? [`موعد التسليم: ذكر العميل يوم ${pendingDate.weekday} دون تأكيد التاريخ — ${pendingDate.question}`] : []),
            ...(project?.analysis?.missing ?? []),
            ...(project?.analysis?.ambiguous ?? []),
          ];
          const seed: Array<[ScopeCategory, string[]]> = [
            ["deliverable", service?.deliverables ?? []],
            ["included", service?.inclusions ?? []],
            ["excluded", service?.exclusions ?? []],
            ["open_item", openItems],
          ];
          items = seed.flatMap(([category, list]) =>
            list.map((content, position) => ({ id: newId(), scope_version_id: versionId, category, content, position })),
          );
        }
        dispatch({ type: "scope/create", version, items });
        return versionId;
      },

      updateScopeVersion(
        id: string,
        patch: Partial<Pick<ScopeVersion, "delivery_deadline" | "revision_rounds" | "notes" | "deadline_status" | "deadline_note">>,
      ) {
        dispatch({ type: "scope/update", id, patch });
      },

      sendScopeForApproval(id: string) {
        const v = state.scopeVersions.find((x) => x.id === id);
        dispatch({ type: "scope/send", id, at: nowIso() });
        if (v) emitAutomationEvent({ type: "scope.sent_for_approval", projectId: v.project_id, versionId: id });
      },

      revertScopeToDraft(id: string) {
        dispatch({ type: "scope/revertToDraft", id });
      },

      /** Saves the current draft as a new draft version; the previous draft is kept as history. Never sends or approves. */
      saveScopeDraft(id: string) {
        const from = state.scopeVersions.find((x) => x.id === id);
        if (!from || from.status !== "draft") return null;
        const prev = latestVersion(state.scopeVersions, from.project_id);
        const versionId = newId();
        const version: ScopeVersion = {
          ...from,
          id: versionId,
          version_number: (prev?.version_number ?? from.version_number) + 1,
          status: "draft",
          created_at: nowIso(),
          sent_at: null,
          approved_at: null,
        };
        const items = state.scopeItems
          .filter((i) => i.scope_version_id === id)
          .map((i) => ({ ...i, id: newId(), scope_version_id: versionId }));
        dispatch({ type: "scope/saveAsNew", fromId: id, version, items });
        return version.version_number;
      },

      approveScope(id: string) {
        const v = state.scopeVersions.find((x) => x.id === id);
        dispatch({ type: "scope/approve", id, at: nowIso() });
        if (v) emitAutomationEvent({ type: "scope.approved", projectId: v.project_id, versionId: id });
      },

      addScopeItem(versionId: string, category: ScopeCategory, content: string) {
        const position =
          Math.max(
            -1,
            ...state.scopeItems
              .filter((i) => i.scope_version_id === versionId && i.category === category)
              .map((i) => i.position),
          ) + 1;
        dispatch({
          type: "scopeItem/add",
          item: { id: newId(), scope_version_id: versionId, category, content, position },
        });
      },

      updateScopeItem(id: string, content: string) {
        dispatch({ type: "scopeItem/update", id, content });
      },

      removeScopeItem(id: string) {
        dispatch({ type: "scopeItem/remove", id });
      },
    }),
    [dispatch, state],
  );
}

type Actions = ReturnType<typeof useCreateActions>;

const DataContext = createContext<AppData | null>(null);
const ActionsContext = createContext<Actions | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialData);
  const hydrated = useRef(false);

  // Load persisted demo data after mount (keeps SSR and first client render identical).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        if (parsed && Array.isArray(parsed.projects) && parsed.profile) dispatch({ type: "data/replace", data: parsed });
      }
    } catch {
      /* corrupt storage: keep seed data */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state]);

  const actions = useCreateActions(dispatch, state);
  return (
    <DataContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </DataContext.Provider>
  );
}

export function useAppData(): AppData {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}

export function useActions(): Actions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useActions must be used inside AppDataProvider");
  return ctx;
}
