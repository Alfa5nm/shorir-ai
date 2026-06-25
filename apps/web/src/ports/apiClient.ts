import type {
  AnonymousSessionResponse,
  CoachReview,
  CoachReviewInput,
  HealthResponse,
  ImageSession,
  ImageSessionInput,
  MealReview,
  MealReviewInput,
  PhoneCameraSession,
  PhoneCameraSessionInput,
  PhoneCameraTunnelResponse,
  PhoneCameraIceCandidateInput,
  PhoneCameraSignalState,
  PhoneCameraSessionDescription,
  PoseEvent,
  PoseEventInput,
  Profile,
  ProfileInput,
  WorkoutSession,
  WorkoutSessionInput
} from "@shorir/contracts";

export interface ApiClient {
  getHealth(): Promise<HealthResponse>;
  createAnonymousSession(): Promise<AnonymousSessionResponse>;
  saveProfile(input: ProfileInput & { id?: string }): Promise<Profile>;
  getProfile(profileId: string): Promise<Profile | null>;
  saveWorkoutSession(input: WorkoutSessionInput): Promise<WorkoutSession>;
  listSessions(profileId: string): Promise<WorkoutSession[]>;
  savePoseEvent(input: PoseEventInput): Promise<PoseEvent>;
  listPoseEvents(profileId: string): Promise<PoseEvent[]>;
  createCoachReview(input: CoachReviewInput): Promise<CoachReview>;
  listCoachReviews(profileId: string): Promise<CoachReview[]>;
  createImageSession(input: ImageSessionInput): Promise<ImageSession>;
  getImageSession(id: string): Promise<ImageSession>;
  getImageSessionReview(id: string): Promise<MealReview | null>;
  uploadMealImage(imageSessionId: string, file: File | Blob): Promise<MealReview>;
  createMealReview(input: MealReviewInput): Promise<MealReview>;
  createPhoneCameraSession(input: PhoneCameraSessionInput): Promise<PhoneCameraSession>;
  ensurePhoneCameraTunnel(): Promise<PhoneCameraTunnelResponse>;
  getPhoneCameraSignal(id: string): Promise<PhoneCameraSignalState>;
  savePhoneCameraOffer(id: string, input: PhoneCameraSessionDescription): Promise<PhoneCameraSignalState>;
  savePhoneCameraAnswer(id: string, input: PhoneCameraSessionDescription): Promise<PhoneCameraSignalState>;
  addPhoneCameraIceCandidate(id: string, input: PhoneCameraIceCandidateInput): Promise<PhoneCameraSignalState>;
}
