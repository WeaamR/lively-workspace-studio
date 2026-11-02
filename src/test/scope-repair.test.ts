import { describe, expect, it } from "vitest";
import { initialData } from "@/data/mock-data";
import { detectWeekdayDeadline, repairScopeData, VERTICAL_MOTION_DELIVERABLE } from "@/lib/scope";

describe("repairScopeData", () => {
  it("weekday question for Nov 2 2026 project", () => {
    expect(detectWeekdayDeadline("التسليم يوم الخميس", "2026-11-02T10:00:00Z")?.question).toBe("هل تقصد يوم الخميس الموافق 5 نوفمبر 2026؟");
  });
  it("rewrites saved 1920×1080 vertical deliverables", () => {
    const d = structuredClone(initialData);
    const v = d.scopeVersions[0]!;
    d.scopeItems.push({ id: "x", scope_version_id: v.id, category: "deliverable", content: "فيديو موشن جرافيك عمودي بمقاس 1920×1080", position: 9 });
    d.services = d.services.map((s) => ({ ...s, deliverables: s.deliverables.map(() => "فيديو موشن جرافيك عمودي 1920x1080") }));
    const r = repairScopeData(d);
    expect(r.scopeItems.find((i) => i.id === "x")!.content).toBe(VERTICAL_MOTION_DELIVERABLE);
    expect(r.services[0]!.deliverables[0]).toBe(VERTICAL_MOTION_DELIVERABLE);
  });
});
