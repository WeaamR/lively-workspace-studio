import { useMemo } from "react";

import { latestApproved, latestVersion } from "@/lib/scope";

import { useAppData } from "./store";

/** Everything a project page needs, derived from the store. */
export function useProjectBundle(projectId: string) {
  const data = useAppData();
  return useMemo(() => {
    const project = data.projects.find((p) => p.id === projectId) ?? null;
    const service = data.services.find((s) => s.id === project?.service_id) ?? null;
    const messages = data.messages
      .filter((m) => m.project_id === projectId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const versions = data.scopeVersions
      .filter((v) => v.project_id === projectId)
      .sort((a, b) => b.version_number - a.version_number);
    const approved = latestApproved(data.scopeVersions, projectId);
    const latest = latestVersion(data.scopeVersions, projectId);
    const itemsFor = (versionId: string) => data.scopeItems.filter((i) => i.scope_version_id === versionId);
    return { project, service, messages, versions, approved, latest, itemsFor, profile: data.profile };
  }, [data, projectId]);
}
