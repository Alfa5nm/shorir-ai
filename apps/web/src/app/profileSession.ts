import type { ApiClient } from "../ports/apiClient";

const legacyProfileIdStorageKey = "shorir.profileId";
const profileIdStorageKey = "shorir.profileId.v2";

export function getStoredProfileId() {
  window.localStorage.removeItem(legacyProfileIdStorageKey);
  return window.localStorage.getItem(profileIdStorageKey);
}

export function storeProfileId(profileId: string) {
  window.localStorage.setItem(profileIdStorageKey, profileId);
}

export async function ensureProfileId(apiClient: ApiClient) {
  const existing = getStoredProfileId();
  if (existing) {
    return existing;
  }
  const session = await apiClient.createAnonymousSession();
  storeProfileId(session.profileId);
  return session.profileId;
}
