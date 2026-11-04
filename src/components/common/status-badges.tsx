import { FlaskConical } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  CLASSIFICATION_LABEL,
  PROJECT_STATUS_LABEL,
  SCOPE_STATUS_LABEL,
  SOURCE_LABEL,
  versionStateLabel,
} from "@/lib/labels";
import type { ChangeClassification, ProjectStatus, ResultSource, ScopeStatus } from "@/lib/types";

type Variant = NonNullable<BadgeProps["variant"]>;

const PROJECT_VARIANT: Record<ProjectStatus, Variant> = {
  pending: "info",
  needs_clarification: "warning",
  in_progress: "violet",
  completed: "success",
};

const SCOPE_VARIANT: Record<ScopeStatus, Variant> = {
  draft: "muted",
  pending_approval: "warning",
  approved: "success",
  superseded: "outline",
};

export const CLASSIFICATION_VARIANT: Record<ChangeClassification, Variant> = {
  within_scope: "success",
  additional_work: "violet",
  needs_clarification: "warning",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={PROJECT_VARIANT[status]}>{PROJECT_STATUS_LABEL[status]}</Badge>;
}

export function ScopeStatusBadge({ status }: { status: ScopeStatus }) {
  return <Badge variant={SCOPE_VARIANT[status]}>{SCOPE_STATUS_LABEL[status]}</Badge>;
}

/** History-aware label: distinguishes never-approved superseded versions from previously approved ones. */
export function VersionStateBadge({ version }: { version: { status: ScopeStatus; approved_at: string | null } }) {
  return <Badge variant={SCOPE_VARIANT[version.status]}>{versionStateLabel(version)}</Badge>;
}

export function ClassificationBadge({ value }: { value: ChangeClassification }) {
  return <Badge variant={CLASSIFICATION_VARIANT[value]}>{CLASSIFICATION_LABEL[value]}</Badge>;
}

export function SourceBadge({ source }: { source: ResultSource }) {
  if (source === "demo") return <DemoBadge />;
  return <Badge variant={source === "ai" ? "navy" : "muted"}>{SOURCE_LABEL[source]}</Badge>;
}

export function DemoBadge({ label = "بيانات تجريبية" }: { label?: string }) {
  return (
    <Badge variant="demo">
      <FlaskConical />
      {label}
    </Badge>
  );
}
