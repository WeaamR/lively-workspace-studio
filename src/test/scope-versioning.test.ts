import { describe, expect, it } from "vitest";

import { initialData } from "@/data/mock-data";
import { reducer } from "@/data/reducer";
import { versionStateLabel } from "@/lib/labels";
import type { AppData, ScopeVersion } from "@/lib/types";

const clone = (): AppData => structuredClone(initialData);

function makeVersion(id: string, status: ScopeVersion["status"], version_number: number): ScopeVersion {
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

describe("save draft behavior", () => {
  it("saving the same draft three times keeps exactly one version with the same id and number", () => {
    let s = clone();
    s = reducer(s, { type: "scope/create", version: makeVersion("d1", "draft", 2), items: [] });
    const before = s.scopeVersions.length;
    for (let i = 0; i < 3; i++) s = reducer(s, { type: "scope/saveDraft", id: "d1" });
    expect(s.scopeVersions.length).toBe(before);
    const v = s.scopeVersions.find((x) => x.id === "d1")!;
    expect(v.version_number).toBe(2);
    expect(v.status).toBe("draft");
  });

  it("saving a non-draft does nothing", () => {
    const s = clone();
    expect(reducer(s, { type: "scope/saveDraft", id: "sv-habba-1" })).toBe(s);
  });
});

describe("create modified version", () => {
  it("supersedes the previous unapproved draft so only one working draft remains", () => {
    let s = clone();
    s = reducer(s, { type: "scope/create", version: makeVersion("d1", "draft", 2), items: [] });
    s = reducer(s, { type: "scope/create", version: makeVersion("d2", "draft", 3), items: [], supersedeId: "d1" });
    expect(s.scopeVersions.find((v) => v.id === "d1")?.status).toBe("superseded");
    expect(s.scopeVersions.filter((v) => v.status === "draft").map((v) => v.id)).toEqual(["d2"]);
  });

  it("keeps the approved version approved when a modified draft is created from it", () => {
    let s = clone();
    // sv-habba-1 is the approved version in the seed data.
    s = reducer(s, { type: "scope/create", version: makeVersion("d1", "draft", 2), items: [], supersedeId: "sv-habba-1" });
    const approved = s.scopeVersions.find((v) => v.id === "sv-habba-1")!;
    expect(approved.status).toBe("approved");
    expect(approved.approved_at).toBeTruthy();
  });

  it("approving the new version supersedes the old approved one but keeps its approved_at", () => {
    let s = clone();
    const oldApprovedAt = s.scopeVersions.find((v) => v.id === "sv-habba-1")!.approved_at;
    s = reducer(s, { type: "scope/create", version: makeVersion("d1", "draft", 2), items: [] });
    s = reducer(s, { type: "scope/approve", id: "d1", at: "2026-11-05T00:00:00Z" });
    const old = s.scopeVersions.find((v) => v.id === "sv-habba-1")!;
    expect(old.status).toBe("superseded");
    expect(old.approved_at).toBe(oldApprovedAt);
    expect(s.scopeVersions.find((v) => v.id === "d1")?.approved_at).toBe("2026-11-05T00:00:00Z");
  });
});

describe("version history labels", () => {
  it("distinguishes current draft, approved, previously approved and never-approved superseded", () => {
    expect(versionStateLabel({ status: "draft", approved_at: null })).toBe("مسودة حالية");
    expect(versionStateLabel({ status: "approved", approved_at: "2026-11-01T00:00:00Z" })).toBe("نطاق معتمد");
    expect(versionStateLabel({ status: "superseded", approved_at: "2026-11-01T00:00:00Z" })).toBe("نسخة سبق اعتمادها");
    expect(versionStateLabel({ status: "superseded", approved_at: null })).toBe("نسخة سابقة غير معتمدة");
  });
});
