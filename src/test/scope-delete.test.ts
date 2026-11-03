import { describe, expect, it } from "vitest";

import { initialData } from "@/data/mock-data";
import { reducer } from "@/data/reducer";
import type { AppData, ScopeVersion } from "@/lib/types";

const clone = (): AppData => structuredClone(initialData);

function makeVersion(id: string, status: ScopeVersion["status"], version_number = 9): ScopeVersion {
  return {
    id,
    project_id: "prj-habba",
    version_number,
    status,
    delivery_deadline: null,
    revision_rounds: 2,
    notes: "",
    created_at: "2026-11-01T00:00:00Z",
    sent_at: null,
    approved_at: null,
  };
}

describe("scope draft deletion", () => {
  it("deletes a draft version together with its scope items", () => {
    let s = clone();
    s = reducer(s, {
      type: "scope/create",
      version: makeVersion("draft-1", "draft"),
      items: [
        { id: "draft-1-item-1", scope_version_id: "draft-1", category: "deliverable", content: "مخرج", position: 0 },
        { id: "draft-1-item-2", scope_version_id: "draft-1", category: "excluded", content: "مستثنى", position: 0 },
      ],
    });
    s = reducer(s, { type: "scope/delete", id: "draft-1" });

    expect(s.scopeVersions.some((v) => v.id === "draft-1")).toBe(false);
    expect(s.scopeItems.some((i) => i.scope_version_id === "draft-1")).toBe(false);
    // Other versions and items stay untouched.
    expect(s.scopeVersions.some((v) => v.id === "sv-habba-1")).toBe(true);
    expect(s.scopeItems.some((i) => i.scope_version_id === "sv-habba-1")).toBe(true);
  });

  it("never deletes approved versions", () => {
    const s = clone();
    expect(s.scopeVersions.find((v) => v.id === "sv-habba-1")?.status).toBe("approved");
    const after = reducer(s, { type: "scope/delete", id: "sv-habba-1" });
    expect(after).toBe(s);
  });

  it("never deletes superseded versions", () => {
    let s = clone();
    s = reducer(s, { type: "scope/create", version: makeVersion("draft-2", "draft", 2), items: [] });
    s = reducer(s, { type: "scope/approve", id: "draft-2", at: "2026-11-02T00:00:00Z" });
    // sv-habba-1 is now superseded.
    expect(s.scopeVersions.find((v) => v.id === "sv-habba-1")?.status).toBe("superseded");
    const after = reducer(s, { type: "scope/delete", id: "sv-habba-1" });
    expect(after).toBe(s);
  });

  it("never deletes a version sent for approval", () => {
    let s = clone();
    s = reducer(s, { type: "scope/create", version: makeVersion("draft-3", "draft", 2), items: [] });
    s = reducer(s, { type: "scope/send", id: "draft-3", at: "2026-11-02T00:00:00Z" });
    const after = reducer(s, { type: "scope/delete", id: "draft-3" });
    expect(after).toBe(s);
  });
});

describe("change review deletion", () => {
  it("clearing the review keeps the original client message", () => {
    const s = clone();
    const reviewed = s.messages.find((m) => m.change_analysis);
    expect(reviewed).toBeDefined();
    const after = reducer(s, { type: "message/update", id: reviewed!.id, patch: { change_analysis: null } });
    const kept = after.messages.find((m) => m.id === reviewed!.id);
    expect(kept).toBeDefined();
    expect(kept!.content).toBe(reviewed!.content);
    expect(kept!.change_analysis).toBeNull();
  });
});
