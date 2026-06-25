export type PhoneCameraSessionStatus = "pending" | "connected" | "expired";

export interface PhoneCameraSession {
  id: string;
  profileId: string;
  status: PhoneCameraSessionStatus;
  createdAt: string;
  expiresAt: string;
}

export interface PhoneCameraSessionInput {
  profileId: string;
}

export interface PhoneCameraTunnelResponse {
  publicUrl: string;
}

export type PhoneCameraPeerRole = "coach" | "phone";

export interface PhoneCameraSessionDescription {
  type: "offer" | "answer";
  sdp: string;
}

export interface PhoneCameraIceCandidate {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export interface PhoneCameraIceCandidateInput {
  role: PhoneCameraPeerRole;
  candidate: PhoneCameraIceCandidate;
}

export interface PhoneCameraSignalState {
  session: PhoneCameraSession;
  offer?: PhoneCameraSessionDescription;
  answer?: PhoneCameraSessionDescription;
  coachCandidates: PhoneCameraIceCandidate[];
  phoneCandidates: PhoneCameraIceCandidate[];
}
