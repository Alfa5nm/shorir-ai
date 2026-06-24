import type { ApiClient } from "../../ports/apiClient";

interface HttpApiClientOptions {
  baseUrl: string;
}

async function request<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export function createHttpApiClient({ baseUrl }: HttpApiClientOptions): ApiClient {
  return {
    getHealth: () => request(baseUrl, "/api/health"),
    createAnonymousSession: () => request(baseUrl, "/api/auth/anonymous", { method: "POST" }),
    saveProfile: (input) =>
      request(baseUrl, "/api/profiles", { method: "POST", body: JSON.stringify(input) }),
    getProfile: (profileId) =>
      request(baseUrl, `/api/profiles/me?profileId=${encodeURIComponent(profileId)}`),
    saveWorkoutSession: (input) =>
      request(baseUrl, "/api/sessions", { method: "POST", body: JSON.stringify(input) }),
    listSessions: (profileId) => request(baseUrl, `/api/sessions?profileId=${encodeURIComponent(profileId)}`),
    savePoseEvent: (input) =>
      request(baseUrl, "/api/events", { method: "POST", body: JSON.stringify(input) }),
    createCoachReview: (input) =>
      request(baseUrl, "/api/coach-review", { method: "POST", body: JSON.stringify(input) }),
    listCoachReviews: (profileId) =>
      request(baseUrl, `/api/coach-review?profileId=${encodeURIComponent(profileId)}`),
    createImageSession: (input) =>
      request(baseUrl, "/api/image-sessions", { method: "POST", body: JSON.stringify(input) }),
    getImageSession: (id) =>
      request(baseUrl, `/api/image-sessions/${encodeURIComponent(id)}`),
    getImageSessionReview: (id) =>
      request(baseUrl, `/api/image-sessions/${encodeURIComponent(id)}/review`),
    uploadMealImage: async (imageSessionId, file) => {
      const form = new FormData();
      form.append("image", file);
      const response = await fetch(`${baseUrl}/api/image-sessions/${imageSessionId}/upload`, {
        method: "POST",
        body: form
      });
      if (!response.ok) {
        throw new Error(`Image upload failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    createMealReview: (input) =>
      request(baseUrl, "/api/meal-review", { method: "POST", body: JSON.stringify(input) }),
    createPhoneCameraSession: (input) =>
      request(baseUrl, "/api/phone-camera-sessions", { method: "POST", body: JSON.stringify(input) }),
    ensurePhoneCameraTunnel: () =>
      request(baseUrl, "/api/dev/phone-camera-tunnel", { method: "POST" }),
    getPhoneCameraSignal: (id) =>
      request(baseUrl, `/api/phone-camera-sessions/${encodeURIComponent(id)}/signal`),
    savePhoneCameraOffer: (id, input) =>
      request(baseUrl, `/api/phone-camera-sessions/${encodeURIComponent(id)}/offer`, {
        method: "POST",
        body: JSON.stringify(input)
      }),
    savePhoneCameraAnswer: (id, input) =>
      request(baseUrl, `/api/phone-camera-sessions/${encodeURIComponent(id)}/answer`, {
        method: "POST",
        body: JSON.stringify(input)
      }),
    addPhoneCameraIceCandidate: (id, input) =>
      request(baseUrl, `/api/phone-camera-sessions/${encodeURIComponent(id)}/ice-candidates`, {
        method: "POST",
        body: JSON.stringify(input)
      })
  };
}
