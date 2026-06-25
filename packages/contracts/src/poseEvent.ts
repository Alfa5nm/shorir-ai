export type PoseEventType =
  | "session_started"
  | "calibration_completed"
  | "rep_completed"
  | "feedback_given"
  | "low_confidence"
  | "pain_reported"
  | "session_completed";

export interface PoseEvent {
  id: string;
  profileId: string;
  sessionId?: string;
  eventType: PoseEventType;
  feedbackCode?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PoseEventInput {
  profileId: string;
  sessionId?: string;
  eventType: PoseEventType;
  feedbackCode?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}
