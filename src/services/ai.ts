/**
 * AI service boundary.
 *
 * The UI only talks to these functions. In phase 2 each one will call a
 * TanStack `createServerFn` that forwards to the AI gateway (or an n8n
 * workflow webhook). No API keys ever live in frontend code.
 *
 * Until then they return `not_connected` — the app never fabricates AI output.
 */
import type { Attachment, ChangeItem, RequestAnalysis, ScopeItem, ScopeVersion, Service } from "@/lib/types";

export type ServiceResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_connected"; message: string }
  | { status: "error"; message: string };

const NOT_CONNECTED_MESSAGE =
  "خدمة التحليل الذكي غير متصلة بعد. سيتم ربطها في المرحلة القادمة، ويمكنك الآن إدخال النتائج يدويًا.";

export interface AnalyzeRequestInput {
  projectId: string;
  title: string;
  clientMessage: string;
  service: Service | null;
  attachments: Attachment[];
}

export type AnalysisPayload = Omit<RequestAnalysis, "source" | "updated_at">;

export async function analyzeClientRequest(
  _input: AnalyzeRequestInput,
): Promise<ServiceResult<AnalysisPayload>> {
  // Phase 2: return await analyzeRequestFn({ data: input });
  return { status: "not_connected", message: NOT_CONNECTED_MESSAGE };
}

export interface CompareChangesInput {
  projectId: string;
  newMessage: string;
  scopeVersion: ScopeVersion;
  scopeItems: ScopeItem[];
}

export interface ComparisonPayload {
  items: Omit<ChangeItem, "id">[];
  suggested_response: string;
}

export async function compareAgainstScope(
  _input: CompareChangesInput,
): Promise<ServiceResult<ComparisonPayload>> {
  // Phase 2: return await compareScopeFn({ data: input });
  return { status: "not_connected", message: NOT_CONNECTED_MESSAGE };
}
