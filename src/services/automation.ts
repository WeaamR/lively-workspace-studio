/**
 * Automation event boundary (n8n-ready).
 *
 * Store actions emit domain events here. In phase 2 a server function will
 * forward them to an n8n webhook (secret URL kept server-side). For now
 * events are only kept in memory for debugging.
 */
export type AutomationEvent =
  | { type: "project.created"; projectId: string }
  | { type: "analysis.saved"; projectId: string }
  | { type: "scope.sent_for_approval"; projectId: string; versionId: string }
  | { type: "scope.approved"; projectId: string; versionId: string }
  | { type: "change.recorded"; projectId: string; messageId: string };

const log: Array<AutomationEvent & { at: string }> = [];

export function emitAutomationEvent(event: AutomationEvent): void {
  log.push({ ...event, at: new Date().toISOString() });
}

export function getAutomationLog() {
  return [...log];
}
