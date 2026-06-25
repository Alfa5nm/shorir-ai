import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { createHttpApiClient } from "../adapters/httpApiClient/httpApiClient";
import { createMediapipePoseEstimator } from "../adapters/mediapipePose/mediapipePoseEstimator";
import { createStaticContentSource } from "../adapters/staticContent/staticContentSource";
import type { ApiClient } from "../ports/apiClient";
import type { ContentSource } from "../ports/contentSource";
import type { PoseEstimator } from "../ports/poseEstimator";

export interface AppServices {
  apiClient: ApiClient;
  contentSource: ContentSource;
  poseEstimator: PoseEstimator;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? window.location.origin;

const services: AppServices = {
  apiClient: createHttpApiClient({ baseUrl: apiBaseUrl }),
  contentSource: createStaticContentSource(),
  poseEstimator: createMediapipePoseEstimator()
};

const AppServicesContext = createContext<AppServices | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}

export function useAppServices() {
  const value = useContext(AppServicesContext);
  if (!value) {
    throw new Error("useAppServices must be used inside AppProviders");
  }
  return value;
}
