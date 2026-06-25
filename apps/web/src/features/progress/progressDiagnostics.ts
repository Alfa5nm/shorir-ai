import type { PoseEvent } from "@shorir/contracts";
import type { SessionDiagnosticsSummary } from "../pose-coach/sessionDiagnostics";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function diagnosticsBySession(events: PoseEvent[]) {
  const result = new Map<string, SessionDiagnosticsSummary>();
  for (const event of events) {
    if (event.eventType !== "session_completed" || !event.sessionId || !isRecord(event.metadata)) continue;
    const diagnostics = event.metadata.diagnostics;
    if (
      !isRecord(diagnostics) ||
      typeof diagnostics.qualityScore !== "number" ||
      typeof diagnostics.rejectedAttempts !== "number" ||
      typeof diagnostics.totalFrames !== "number" ||
      !Array.isArray(diagnostics.topIssues) ||
      typeof diagnostics.nextAction !== "string"
    ) {
      continue;
    }
    result.set(event.sessionId, diagnostics as unknown as SessionDiagnosticsSummary);
  }
  return result;
}
