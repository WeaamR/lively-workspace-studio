import { describe, expect, it } from "vitest";

import { initialData } from "@/data/mock-data";
import { demoAnalyzeRequest, demoCompare } from "@/services/demo-engine";

describe("demo engine", () => {
  it("labels every analysis as demo and flags a missing budget", () => {
    const a = demoAnalyzeRequest("نحتاج شعار بسيط للمخبز خلال شهر.", null);
    expect(a.source).toBe("demo");
    expect(a.missing).toContain("الميزانية المتاحة للمشروع.");
  });

  it("classifies a request matching an excluded clause as additional work", () => {
    const v = initialData.scopeVersions.find((x) => x.id === "sv-habba-1")!;
    const items = initialData.scopeItems.filter((i) => i.scope_version_id === v.id);
    const r = demoCompare("بدنا تصميم الأكواب والتغليف", v, items, "أحمد", "ليان");
    expect(r.items[0]?.classification).toBe("additional_work");
    expect(r.items[0]?.scope_item_id).toBe("sv-habba-1-excluded-2");
  });

  it("includes the motion graphics demo service with 2 revisions and exclusions", () => {
    const s = initialData.services.find((x) => x.id === "svc-motion")!;
    expect(s.revision_limit).toBe(2);
    expect(s.exclusions).toEqual(["التعليق الصوتي", "ملفات المشروع المصدرية"]);
    expect(s.deliverables[0]).toContain("1080×1920");
  });
});
