/**
 * App data provider (phase 1: in-memory, seeded with demo data).
 *
 * Components only use `useAppData()` / `useActions()`. In phase 2 the
 * internals are swapped for Supabase + TanStack Query; the hook surface stays.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";

import { newId, nowIso } from "@/lib/format";
import { detectWeekdayDeadline, latestVersion, repairScopeData } from "@/lib/scope";
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

import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

import { emptyData } from "./empty";
import {
  loadAppData,
  persistAction,
  resolveScopeItemRecord,
} from "./remote";import { reducer, type Action } from "./reducer";


export interface NewProjectInput {
  title: string;
  client_name: string;
  service_id: string | null;
  original_request: string;
  attachments: Attachment[];
}

function useCreateActions(dispatch: (a: Action) => void, getState: () => AppData) {
  return useMemo(
    () => ({
      async signOut() {
        await supabase.auth.signOut();
      },

      updateProfile(patch: Partial<Profile>) {
        dispatch({ type: "profile/update", patch });
      },

      saveService(service: Omit<Service, "id" | "user_id" | "created_at"> & { id?: string }) {
        const existing = service.id ? getState().services.find((s) => s.id === service.id) : undefined;
        const full: Service = {
          ...service,
          id: existing?.id ?? newId(),
          user_id: getState().profile.id,
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
          user_id: getState().profile.id,
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

      /**
       * Deletes the change review record only. The original client message
       * stays in project_messages and the project is untouched.
       */
      deleteChangeReview(messageId: string): boolean {
        const m = getState().messages.find((x) => x.id === messageId);
        if (!m?.change_analysis) return false;
        dispatch({ type: "message/update", id: messageId, patch: { change_analysis: null } });
        return true;
      },

      /**
       * The only action that creates a new version ("إنشاء نسخة معدّلة").
       * Copies the latest version (or seeds from the project's service), assigns
       * MAX(version_number) + 1, and supersedes a previous unapproved draft so
       * only one working draft exists. An approved version stays approved.
       */
      createScopeVersion(projectId: string) {
        const project = getState().projects.find((p) => p.id === projectId);
        const prev = latestVersion(getState().scopeVersions, projectId);
        const service = getState().services.find((s) => s.id === project?.service_id);
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
          items = getState().scopeItems
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
        const supersedeId =
          prev && !prev.approved_at && (prev.status === "draft" || prev.status === "pending_approval") ? prev.id : undefined;
        dispatch({ type: "scope/create", version, items, supersedeId });
        return versionId;
      },

      updateScopeVersion(
        id: string,
        patch: Partial<Pick<ScopeVersion, "delivery_deadline" | "revision_rounds" | "notes" | "deadline_status" | "deadline_note">>,
      ) {
        dispatch({ type: "scope/update", id, patch });
      },

      sendScopeForApproval(id: string) {
        const v = getState().scopeVersions.find((x) => x.id === id);
        dispatch({ type: "scope/send", id, at: nowIso() });
        if (v) emitAutomationEvent({ type: "scope.sent_for_approval", projectId: v.project_id, versionId: id });
      },

      revertScopeToDraft(id: string) {
        dispatch({ type: "scope/revertToDraft", id });
      },

      /**
       * Saves the draft in place: same record, same version number, no new
       * version, no status change. Edits are already persisted incrementally,
       * so this confirms the save. Never sends or approves.
       */
      saveScopeDraft(id: string): boolean {
        const from = getState().scopeVersions.find((x) => x.id === id);
        if (!from || from.status !== "draft") return false;
        dispatch({ type: "scope/saveDraft", id });
        return true;
      },

      /**
       * Deletes a never-approved draft or superseded version with its items.
       * Blocked when the version was ever approved, is sent/approved, or when
       * a recorded change review references it.
       */
      deleteScopeDraft(id: string): { ok: boolean; reason?: "not_draft" | "referenced" } {
        const state = getState();
        const v = state.scopeVersions.find((x) => x.id === id);
        if (!v || v.approved_at || (v.status !== "draft" && v.status !== "superseded")) return { ok: false, reason: "not_draft" };
        const referenced = state.messages.some((m) => m.change_analysis?.scope_version_id === id);
        if (referenced) return { ok: false, reason: "referenced" };
        dispatch({ type: "scope/delete", id });
        return { ok: true };
      },

      approveScope(id: string) {
        const v = getState().scopeVersions.find((x) => x.id === id);
        dispatch({ type: "scope/approve", id, at: nowIso() });
        if (v) emitAutomationEvent({ type: "scope.approved", projectId: v.project_id, versionId: id });
      },

      addScopeItem(versionId: string, category: ScopeCategory, content: string) {
        const position =
          Math.max(
            -1,
            ...getState().scopeItems
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

      
async resolveScopeItem(input: {
  itemId: string;
  answer: string;
  resolvedCategory: Exclude<ScopeCategory, "condition" | "open_item">;
  resolvedTitle: string;
  resolvedDescription: string;
  confirmedByFreelancer: boolean;
}) {
  const state = getState();

  const item = state.scopeItems.find(
    (i) => i.id === input.itemId
  );

  if (!item || item.category !== "open_item") {
    throw new Error("هذا البند ليس بندًا غير محسوم.");
  }

  const version = state.scopeVersions.find(
    (v) => v.id === item.scope_version_id
  );

  if (!version || version.status !== "draft") {
    throw new Error("يمكن حسم البنود داخل المسودات فقط.");
  }

  if (!input.confirmedByFreelancer) {
    throw new Error("يجب تأكيد مراجعة المستقل أولًا.");
  }

  // Persist through the authenticated Edge Function.
  await resolveScopeItemRecord({
    item_id: item.id,
    answer: input.answer,
    resolved_category: input.resolvedCategory,
    resolved_title: input.resolvedTitle,
    resolved_description: input.resolvedDescription,
    confirmed_by_freelancer: true,
  });

  // Update local state only after the server confirms success.
  dispatch({
    type: "scopeItem/resolve",
    id: item.id,
    resolved_category: input.resolvedCategory,
    resolved_title: input.resolvedTitle,
  });

  return true;
},


      removeScopeItem(id: string) {
        dispatch({ type: "scopeItem/remove", id });
      },
    }),
    [dispatch, getState],
  );
}

type Actions = ReturnType<typeof useCreateActions>;

export type DataStatus = "loading" | "ready" | "signed_out" | "error";

const DataContext = createContext<AppData | null>(null);
const ActionsContext = createContext<Actions | null>(null);
const StatusContext = createContext<{ status: DataStatus; error: string | null; reload: () => void }>({
  status: "loading",
  error: null,
  reload: () => {},
});

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, emptyData);
  const stateRef = useRef<AppData>(emptyData);
  const userIdRef = useRef<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const [status, setStatus] = useState<DataStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    userIdRef.current = user?.id ?? null;
    if (!user) {
      stateRef.current = emptyData;
      rawDispatch({ type: "data/replace", data: emptyData });
      setStatus("signed_out");
      return;
    }
    try {
      const loaded = await loadAppData(user);
      stateRef.current = reducer(stateRef.current, { type: "data/replace", data: loaded });
      rawDispatch({ type: "data/replace", data: loaded });
      setError(null);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "SIGNED_IN" && session?.user.id !== userIdRef.current)) void load();
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  /** Applies the action locally, then writes it to the database in order. */
  const dispatch = useCallback(
    (action: Action) => {
      const prev = stateRef.current;
      const next = reducer(prev, action);
      stateRef.current = next;
      rawDispatch(action);
      const userId = userIdRef.current;
      if (!userId) return;
      queue.current = queue.current
        .then(() => persistAction(action, prev, next, userId))
        .catch((e: unknown) => {
          toast.error("تعذّر حفظ التغيير في قاعدة البيانات", {
            description: e instanceof Error ? e.message : String(e),
          });
          void load();
        });
    },
    [load],
  );

  const getState = useCallback(() => stateRef.current, []);
  const actions = useCreateActions(dispatch, getState);
  const statusValue = useMemo(() => ({ status, error, reload: () => void load() }), [status, error, load]);
  return (
    <StatusContext.Provider value={statusValue}>
      <DataContext.Provider value={state}>
        <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
      </DataContext.Provider>
    </StatusContext.Provider>
  );
}

export function useDataStatus() {
  return useContext(StatusContext);
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
