import { CLASSIFICATION_LABEL, SCOPE_CATEGORY_ORDER } from "./labels";
import type { ChangeItem, ScopeCategory, ScopeItem, ScopeVersion } from "./types";

/** Items of one category, ordered by position. */
export function itemsByCategory(items: ScopeItem[], category: ScopeCategory): ScopeItem[] {
  return items.filter((i) => i.category === category).sort((a, b) => a.position - b.position);
}

/**
 * Stable clause number for an item inside its scope version, e.g. "3.2"
 * = third section (excluded services), second clause.
 */
export function clauseRef(item: ScopeItem, versionItems: ScopeItem[]): string {
  const section = SCOPE_CATEGORY_ORDER.indexOf(item.category) + 1;
  const index = itemsByCategory(versionItems, item.category).findIndex((i) => i.id === item.id) + 1;
  return `${section}.${index}`;
}

/** The latest approved version of a project, or null. */
export function latestApproved(versions: ScopeVersion[], projectId: string): ScopeVersion | null {
  return (
    versions
      .filter((v) => v.project_id === projectId && v.status === "approved")
      .sort((a, b) => b.version_number - a.version_number)[0] ?? null
  );
}

/** The newest version (any status) of a project, or null. */
export function latestVersion(versions: ScopeVersion[], projectId: string): ScopeVersion | null {
  return (
    versions
      .filter((v) => v.project_id === projectId)
      .sort((a, b) => b.version_number - a.version_number)[0] ?? null
  );
}

/** Deterministic template — not AI. Builds a clarification message from the freelancer's own questions. */
export function composeClarificationMessage(
  clientName: string,
  questions: string[],
  freelancerName: string,
): string {
  const clean = questions.map((q) => q.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  const list = clean.map((q, i) => `${i + 1}. ${q}`).join("\n");
  return `مرحبًا ${clientName}،\n\nشكرًا لتواصلك ومشاركة تفاصيل المشروع. قبل أن أرسل لك نطاق العمل والتكلفة النهائية، أحتاج إلى توضيح النقاط التالية:\n\n${list}\n\nبمجرد وصول ردك سأجهّز نطاق العمل للمراجعة والموافقة.\n\nمع التحية،\n${freelancerName}`;
}

/** Deterministic template — not AI. Builds a reply from the freelancer's own classifications. */
export function composeChangeResponse(
  clientName: string,
  items: ChangeItem[],
  clauseLookup: (scopeItemId: string | null) => string | null,
  freelancerName: string,
): string {
  if (items.length === 0) return "";
  const groups: Record<ChangeItem["classification"], ChangeItem[]> = {
    within_scope: [],
    additional_work: [],
    needs_clarification: [],
  };
  items.forEach((i) => groups[i.classification].push(i));

  const line = (i: ChangeItem) => {
    const ref = clauseLookup(i.scope_item_id);
    return `• ${i.request_text}${ref ? ` (البند ${ref})` : ""}`;
  };

  const parts: string[] = [`مرحبًا ${clientName}،`, "", "شكرًا على رسالتك. راجعت طلباتك مقارنةً بنطاق العمل المعتمد:"];
  if (groups.within_scope.length) {
    parts.push("", `${CLASSIFICATION_LABEL.within_scope} — سأعمل عليها مباشرة:`, ...groups.within_scope.map(line));
  }
  if (groups.additional_work.length) {
    parts.push(
      "",
      `${CLASSIFICATION_LABEL.additional_work} — خارج النطاق الحالي، وسأرسل لك عرض سعر ومدة منفصلين:`,
      ...groups.additional_work.map(line),
    );
  }
  if (groups.needs_clarification.length) {
    parts.push("", "نقاط أحتاج توضيحها منك قبل البدء:", ...groups.needs_clarification.map(line));
  }
  parts.push("", "يسعدني الإجابة عن أي استفسار.", "", "مع التحية،", freelancerName);
  return parts.join("\n");
}
