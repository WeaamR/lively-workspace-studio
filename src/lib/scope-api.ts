
import { supabase } from "@/integrations/supabase/client";

// ==========================================
// SCOPE API - Shared Edge Functions Client
// ==========================================

export type ScopeResolutionCategory =
  | "deliverable"
  | "included"
  | "excluded"
  | "client_responsibility";

export interface AnalyzeRequestInput {
  project_id: string;
  service_id: string;
  client_message: string;
}

export interface DetectChangesInput {
  project_id: string;
  new_client_message: string;
}

export interface ResolveScopeItemInput {
  item_id: string;
  answer: string;
  resolved_category: ScopeResolutionCategory;
  resolved_title: string;
  resolved_description: string;
  confirmed_by_freelancer: boolean;
}

export interface ScopeAnalysisResponse {
  success: true;
  model: string;
  analysis_id: string;
  analysis: Record<string, unknown>;
}

export interface ScopeChangesResponse {
  success: true;
  model: string;
  scope_version_id: string;
  version_number: number;
  review_id: string;
  analysis: Record<string, unknown>;
}

export interface ScopeResolutionResponse {
  success: true;
  message: string;
  item_id: string;
  scope_version_id: string;
  project_id: string;
  resolved_category: ScopeResolutionCategory;
  resolved_title: string;
  database_result: unknown;
}

// ==========================================
// Authentication
// ==========================================

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error("تعذر التحقق من جلسة المستخدم.");
  }

  if (!session?.access_token) {
    throw new Error("يرجى تسجيل الدخول أولاً.");
  }

  return session.access_token;
}

// ==========================================
// Shared Edge Function Caller
// ==========================================

async function invokeScopeFunction<T extends { success: boolean }>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const accessToken = await getAccessToken();

  const { data, error } = await supabase.functions.invoke<T>(
    functionName,
    {
      body,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (error) {
    let message = error.message;

    const context = (
      error as unknown as { context?: Response }
    ).context;

    if (context instanceof Response) {
      try {
        const payload = await context.clone().json();

        message =
          payload?.error ||
          payload?.message ||
          message;
      } catch {
        // Keep the original error message.
      }
    }

    throw new Error(message || "حدث خطأ أثناء الاتصال بالخادم.");
  }

  if (!data || data.success !== true) {
    throw new Error(
      (data as any)?.error ||
      "تعذر تنفيذ العملية."
    );
  }

  return data;
}

// ==========================================
// 01. Request Analysis
// ==========================================

export async function analyzeRequest(
  input: AnalyzeRequestInput
): Promise<ScopeAnalysisResponse> {

  if (
    !input.project_id ||
    !input.service_id ||
    !input.client_message?.trim()
  ) {
    throw new Error("يرجى إدخال المشروع والخدمة ورسالة العميل.");
  }

  return invokeScopeFunction<ScopeAnalysisResponse>(
    "analyze-request",
    {
      project_id: input.project_id,
      service_id: input.service_id,
      client_message: input.client_message.trim(),
    }
  );
}

// ==========================================
// 02. Change Detection
// ==========================================

export async function detectChanges(
  input: DetectChangesInput
): Promise<ScopeChangesResponse> {

  if (
    !input.project_id ||
    !input.new_client_message?.trim()
  ) {
    throw new Error("يرجى اختيار المشروع وإدخال رسالة التعديل.");
  }

  return invokeScopeFunction<ScopeChangesResponse>(
    "detect-changes",
    {
      project_id: input.project_id,
      new_client_message: input.new_client_message.trim(),
    }
  );
}

// ==========================================
// 03. Scope Resolution
// ==========================================

export async function resolveScopeItem(
  input: ResolveScopeItemInput
): Promise<ScopeResolutionResponse> {

  if (
    !input.item_id ||
    !input.answer?.trim() ||
    !input.resolved_title?.trim()
  ) {
    throw new Error("يرجى استكمال بيانات معالجة البند.");
  }

  if (input.confirmed_by_freelancer !== true) {
    throw new Error("يجب تأكيد مراجعة المستقل قبل التحديث.");
  }

  return invokeScopeFunction<ScopeResolutionResponse>(
    "resolve-scope-item",
    {
      item_id: input.item_id,
      answer: input.answer.trim(),
      resolved_category: input.resolved_category,
      resolved_title: input.resolved_title.trim(),
      resolved_description:
        input.resolved_description?.trim() || input.answer.trim(),
      confirmed_by_freelancer: true,
    }
  );
}
