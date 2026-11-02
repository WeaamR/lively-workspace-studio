import { describe, expect, it } from "vitest";
import { reducer } from "@/data/reducer";
import { initialData } from "@/data/mock-data";
import { detectWeekdayDeadline } from "@/lib/scope";

describe("scope rules", () => {
  it("treats 'Thursday' as unconfirmed and suggests Thursday 5 Nov 2026", () => {
    const r = detectWeekdayDeadline("أحتاجه يوم الخميس", "2026-11-02T13:36:00Z")!;
    expect(r.suggestedDate).toBe("2026-11-05");
    expect(r.question).toContain("5 نوفمبر 2026");
  });
  it("returns null when no weekday is mentioned", () => {
    expect(detectWeekdayDeadline("أحتاج فيديو", "2026-11-02T00:00:00Z")).toBeNull();
  });
  it("motion service: vertical 1080×1920 and 2 revisions", () => {
    const s = initialData.services.find((x) => x.id === "svc-motion")!;
    expect(s.deliverables[0]).toContain("1080×1920");
    expect(s.revision_limit).toBe(2);
    expect(s.inclusions?.length).toBeGreaterThan(0);
  });
  it("saving a draft creates a new draft version and never approves", () => {
    const base = { ...initialData, scopeVersions: [{ id: "a", project_id: "p", version_number: 1, status: "draft" as const, delivery_deadline: null, revision_rounds: 2, notes: "", created_at: "", sent_at: null, approved_at: null }] };
    const next = reducer(base, { type: "scope/saveAsNew", fromId: "a", version: { ...base.scopeVersions[0], id: "b", version_number: 2 }, items: [] });
    expect(next.scopeVersions.find((v) => v.id === "b")!.status).toBe("draft");
    expect(next.scopeVersions.some((v) => v.status === "approved" || v.status === "pending_approval")).toBe(false);
  });
});
