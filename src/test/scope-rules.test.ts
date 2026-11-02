import { describe, expect, it } from "vitest";

import { initialData } from "@/data/mock-data";
import { reducer } from "@/data/reducer";
import { clauseRef, latestApproved } from "@/lib/scope";
import type { AppData } from "@/lib/types";

const clone = (): AppData => structuredClone(initialData);

describe("scope approval rules", () => {
  it("approving a new version supersedes the previously approved one", () => {
    let s = clone();
    s = reducer(s, {
      type: "scope/create",
      version: {
        id: "v2",
        project_id: "prj-habba",
        version_number: 2,
        status: "draft",
        delivery_deadline: null,
        revision_rounds: 3,
        notes: "",
        created_at: "2026-11-01T00:00:00Z",
        sent_at: null,
        approved_at: null,
      },
      items: [],
    });
    s = reducer(s, { type: "scope/send", id: "v2", at: "2026-11-02T00:00:00Z" });
    s = reducer(s, { type: "scope/approve", id: "v2", at: "2026-11-03T00:00:00Z" });

    expect(s.scopeVersions.find((v) => v.id === "sv-habba-1")?.status).toBe("superseded");
    expect(latestApproved(s.scopeVersions, "prj-habba")?.id).toBe("v2");
    expect(s.scopeVersions.find((v) => v.id === "v2")?.approved_at).toBe("2026-11-03T00:00:00Z");
  });

  it("approved scope items cannot be edited, added or removed", () => {
    const s = clone();
    const target = s.scopeItems.find((i) => i.scope_version_id === "sv-habba-1")!;
    const afterUpdate = reducer(s, { type: "scopeItem/update", id: target.id, content: "تغيير" });
    const afterRemove = reducer(s, { type: "scopeItem/remove", id: target.id });
    const afterAdd = reducer(s, {
      type: "scopeItem/add",
      item: { id: "x", scope_version_id: "sv-habba-1", category: "included", content: "جديد", position: 9 },
    });
    expect(afterUpdate).toBe(s);
    expect(afterRemove).toBe(s);
    expect(afterAdd).toBe(s);
  });

  it("numbers clauses as section.position, e.g. the 2nd exclusion is 3.2", () => {
    const items = initialData.scopeItems.filter((i) => i.scope_version_id === "sv-habba-1");
    const secondExclusion = items.find((i) => i.id === "sv-habba-1-excluded-2")!;
    expect(clauseRef(secondExclusion, items)).toBe("3.2");
  });
});
