export type ImageSessionStatus = "pending" | "uploaded" | "processed" | "expired";

export interface ImageSession {
  id: string;
  profileId: string;
  status: ImageSessionStatus;
  uploadUrl: string;
  createdAt: string;
  expiresAt: string;
}

export interface ImageSessionInput {
  profileId: string;
}
