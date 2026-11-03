import { describe, expect, it } from "vitest";

import { categoryToDb, overallClassification, projectStatusToDb, versionToDb } from "@/data/remote";
import type { ScopeVersion } from "@/lib/types";

const base: ScopeVersion = {
  id: "v1",
  project_id: "p1",
  version_number: 1,
  status: "draft",
  delivery_deadline: "2026-11-05",
  revision_rounds: 2,
  notes: "",
  created_at: "",
  sent_at: null,
  approved_at: null,
};

describe("database mapping", () => {
  it("keeps delivery_deadline NULL while the date is pending confirmation", () => {
    const row = versionToDb(
      { ...base, deadline_status: "pending_clarification", deadline_note: "هل تقصد الخميس 5 نوفمبر 2026؟" },
      "u1",
    );
    expect(row.delivery_deadline).toBeNull();
    expect(row.delivery_condition).toBe("هل تقصد الخميس 5 نوفمبر 2026؟");
  });

  it("stores a confirmed deadline with no pending condition", () => {
    const row = versionToDb({ ...base, deadline_status: "confirmed" }, "u1");
    expect(row.delivery_deadline).toBe("2026-11-05");
    expect(row.delivery_condition).toBeNull();
  });

  it("writes rows with the authenticated user id and sent drafts as draft", () => {
    const row = versionToDb({ ...base, status: "pending_approval" }, "u1");
    expect(row.user_id).toBe("u1");
    expect(row.status).toBe("draft");
  });

  it("maps open items to the unresolved category", () => {
    expect(categoryToDb("open_item")).toBe("unresolved");
    expect(categoryToDb("condition")).toBeNull();
  });

  it("maps pending projects to new and mixed change findings to mixed", () => {
    expect(projectStatusToDb("pending")).toBe("new");
    expect(overallClassification([{ classification: "within_scope" }, { classification: "additional_work" }])).toBe("mixed");
  });
});
