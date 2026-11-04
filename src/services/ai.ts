
/**
 * SCOPE AI Service
 * Connects the existing UI to authenticated Supabase Edge Functions.
 */

import type {
  Attachment,
  ChangeClassification,
  ChangeItem,
  RequestAnalysis,
  ScopeItem,
  ScopeVersion,
  Service,
} from "@/lib/types";

import {
  analyzeRequest,
  detectChanges,
} from "@/lib/scope-api";

export type ServiceResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_connected"; message: string }
  | { status: "error"; message: string };

export interface AnalyzeRequestInput {
  projectId: string;
  title: string;
  clientMessage: string;
  service: Service | null;
  attachments: Attachment[];
}

export type AnalysisPayload = Omit<
  RequestAnalysis,
  "source" | "updated_at"
>;

export interface CompareChangesInput {
  projectId: string;
  newMessage: string;
  scopeVersion: ScopeVersion;
  scopeItems: ScopeItem[];
}

export interface ComparisonPayload {
  items: Omit<ChangeItem, "id">[];
  suggested_response: string;
  scope_version_id: string;
  version_number?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item : ""))
    .filter(Boolean);
}

function ambiguityText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return "";

  const label =
    stringValue(value["item"]) ||
    stringValue(value["element"]) ||
    stringValue(value["term"]) ||
    stringValue(value["cause"]);

  const reason =
    stringValue(value["reason"]) ||
    stringValue(value["ambiguity"]) ||
    stringValue(value["effect"]) ||
    stringValue(value["impact"]);

  return [label, reason].filter(Boolean).join(" — ");
}

function ambiguityArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(ambiguityText).filter(Boolean);
}

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function findSupportingItemId(
  evidence: string,
  items: ScopeItem[],
): string | null {
  const normalizedEvidence = normalizeForMatch(evidence);

  if (!normalizedEvidence) return null;

  const match = items.find((item) => {
    const content = normalizeForMatch(item.content);

    return content.length > 3 && normalizedEvidence.includes(content);
  });

  return match?.id ?? null;
}

function changeClassification(value: unknown): ChangeClassification {
  if (
    value === "within_scope" ||
    value === "additional_work" ||
    value === "needs_clarification"
  ) {
    return value;
  }

  return "needs_clarification";
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

// ==========================================
// 01. Request Analysis
// ==========================================

export async function analyzeClientRequest(
  input: AnalyzeRequestInput,
): Promise<ServiceResult<AnalysisPayload>> {
  if (!input.service) {
    return {
      status: "error",
      message:
        "اختاري خدمة من خدماتك قبل تحليل الطلب حتى تتم المقارنة مع شروطها الفعلية.",
    };
  }

  try {
    const result = await analyzeRequest({
      project_id: input.projectId,
      service_id: input.service.id,
      client_message: input.clientMessage,
    });

    const analysis = result.analysis;

    return {
      status: "ok",
      data: {
        confirmed: stringArray(analysis["confirmed_facts"]),
        missing: stringArray(analysis["missing_information"]),
        ambiguous: ambiguityArray(analysis["ambiguities"]),
        risks: stringArray(analysis["risks"]),
        questions: stringArray(analysis["suggested_questions"]),
        client_message: stringValue(
          analysis["suggested_client_message"],
        ),
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(
        error,
        "تعذر تحليل طلب العميل حاليًا.",
      ),
    };
  }
}

// ==========================================
// 02. Change Detection
// ==========================================

export async function compareAgainstScope(
  input: CompareChangesInput,
): Promise<ServiceResult<ComparisonPayload>> {
  try {
    const result = await detectChanges({
      project_id: input.projectId,
      new_client_message: input.newMessage,
    });

    const rawAssessment = result.analysis["change_assessment"];

    if (!Array.isArray(rawAssessment)) {
      return {
        status: "error",
        message: "استجابة محرك مقارنة التعديلات غير مكتملة.",
      };
    }

    const items = rawAssessment
      .filter(isRecord)
      .map((entry) => {
        const evidence = stringValue(entry["agreement_evidence"]);

        const note = [
          evidence
            ? `الدليل من الاتفاق: ${evidence}`
            : "لا يوجد بند معتمد وصريح يحسم هذا الطلب.",
          stringValue(entry["reason"]),
          entry["potential_impact"]
            ? `الأثر المحتمل: ${stringValue(entry["potential_impact"])}`
            : "",
          entry["recommended_action"]
            ? `الإجراء المقترح: ${stringValue(entry["recommended_action"])}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n");

        return {
          request_text: stringValue(entry["requested_change"]),
          classification: changeClassification(
            entry["classification"],
          ),
          scope_item_id: findSupportingItemId(
            evidence,
            input.scopeItems,
          ),
          note,
        } satisfies Omit<ChangeItem, "id">;
      })
      .filter((item) => item.request_text.length > 0);

    return {
      status: "ok",
      data: {
        items,
        suggested_response: stringValue(
          result.analysis["suggested_response"],
        ),
        scope_version_id:
          result.scope_version_id || input.scopeVersion.id,
        version_number: result.version_number,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(
        error,
        "تعذرت مقارنة طلب العميل بالنطاق المعتمد.",
      ),
    };
  }
}
