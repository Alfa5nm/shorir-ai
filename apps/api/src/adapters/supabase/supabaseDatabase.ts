import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  CoachReview,
  ImageSession,
  MealReview,
  PoseEvent,
  PoseEventInput,
  Profile,
  ProfileInput,
  SafetyFlags,
  WorkoutSession,
  WorkoutSessionInput
} from "@shorir/contracts";
import type { Database } from "../../ports/database.js";

interface ProfileRow {
  id: string;
  display_name: string | null;
  language: Profile["language"];
  goal: string;
  fitness_level: Profile["fitnessLevel"];
  equipment: Profile["equipment"];
  weekly_schedule: string[];
  safety: SafetyFlags;
  height: number | string | null;
  weight: number | string | null;
  target_weight: number | string | null;
  age: number | string | null;
  gender: Profile["gender"] | null;
  created_at: string;
  updated_at: string;
}

interface WorkoutSessionRow {
  id: string;
  profile_id: string;
  exercise: WorkoutSession["exercise"];
  duration_seconds: number;
  reps_completed: number;
  confidence_avg: number | string;
  completion_status: WorkoutSession["completionStatus"];
  safety_flag: boolean;
  started_at: string;
  ended_at: string;
}

interface PoseEventRow {
  id: string;
  profile_id: string;
  session_id: string | null;
  event_type: PoseEvent["eventType"];
  feedback_code: string | null;
  confidence: number | string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface CoachReviewRow {
  id: string;
  profile_id: string;
  session_id: string;
  summary_bn: string;
  summary_en: string;
  next_action: string;
  form_focus: string[];
  safety_note: string;
  confidence_level: CoachReview["confidenceLevel"];
  encouragement: string;
  limitations: string[];
  created_at: string;
}

interface ImageSessionRow {
  id: string;
  profile_id: string;
  status: ImageSession["status"];
  upload_url: string;
  created_at: string;
  expires_at: string;
}

interface MealReviewRow {
  id: string;
  profile_id: string;
  image_session_id: string | null;
  probable_dishes: string[];
  confidence_level: MealReview["confidenceLevel"];
  portion_questions: string[];
  calorie_range: string | null;
  macro_notes: string[];
  profile_signals: string[];
  limitations: string[];
  created_at: string;
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required when DATABASE_ADAPTER=supabase.`);
  }
  return value;
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return undefined;
  }
  return typeof value === "number" ? value : Number(value);
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    ...(row.display_name ? { displayName: row.display_name } : {}),
    language: row.language,
    goal: row.goal,
    fitnessLevel: row.fitness_level,
    equipment: row.equipment,
    weeklySchedule: row.weekly_schedule,
    safety: row.safety,
    ...(toNumber(row.height) === undefined ? {} : { height: toNumber(row.height) }),
    ...(toNumber(row.weight) === undefined ? {} : { weight: toNumber(row.weight) }),
    ...(toNumber(row.target_weight) === undefined ? {} : { targetWeight: toNumber(row.target_weight) }),
    ...(toNumber(row.age) === undefined ? {} : { age: toNumber(row.age) }),
    ...(row.gender ? { gender: row.gender } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapWorkoutSession(row: WorkoutSessionRow): WorkoutSession {
  return {
    id: row.id,
    profileId: row.profile_id,
    exercise: row.exercise,
    durationSeconds: row.duration_seconds,
    repsCompleted: row.reps_completed,
    confidenceAvg: toNumber(row.confidence_avg) ?? 0,
    completionStatus: row.completion_status,
    safetyFlag: row.safety_flag,
    startedAt: row.started_at,
    endedAt: row.ended_at
  };
}

function mapPoseEvent(row: PoseEventRow): PoseEvent {
  const confidence = toNumber(row.confidence);
  return {
    id: row.id,
    profileId: row.profile_id,
    ...(row.session_id ? { sessionId: row.session_id } : {}),
    eventType: row.event_type,
    ...(row.feedback_code ? { feedbackCode: row.feedback_code } : {}),
    ...(confidence === undefined ? {} : { confidence }),
    metadata: row.metadata,
    createdAt: row.created_at
  };
}

function mapCoachReview(row: CoachReviewRow): CoachReview {
  return {
    id: row.id,
    profileId: row.profile_id,
    sessionId: row.session_id,
    summaryBn: row.summary_bn,
    summaryEn: row.summary_en,
    nextAction: row.next_action,
    formFocus: row.form_focus,
    safetyNote: row.safety_note,
    confidenceLevel: row.confidence_level,
    encouragement: row.encouragement,
    limitations: row.limitations,
    createdAt: row.created_at
  };
}

function mapImageSession(row: ImageSessionRow): ImageSession {
  return {
    id: row.id,
    profileId: row.profile_id,
    status: row.status,
    uploadUrl: row.upload_url,
    createdAt: row.created_at,
    expiresAt: row.expires_at
  };
}

function mapMealReview(row: MealReviewRow): MealReview {
  return {
    id: row.id,
    profileId: row.profile_id,
    ...(row.image_session_id ? { imageSessionId: row.image_session_id } : {}),
    probableDishes: row.probable_dishes,
    confidenceLevel: row.confidence_level,
    portionQuestions: row.portion_questions,
    ...(row.calorie_range ? { calorieRange: row.calorie_range } : {}),
    macroNotes: row.macro_notes,
    profileSignals: row.profile_signals,
    limitations: row.limitations,
    createdAt: row.created_at
  };
}

export function createSupabaseDatabase(client?: SupabaseClient): Database {
  const supabase =
    client ??
    createClient(requiredEnv("SUPABASE_URL"), process.env.SUPABASE_SERVICE_ROLE_KEY ?? requiredEnv("SUPABASE_SECRET_KEY"), {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

  return {
    adapterName: "supabase",
    async createAnonymousProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          language: "mixed",
          goal: "Start guided fitness safely",
          fitness_level: "beginner",
          equipment: ["none"],
          weekly_schedule: [],
          safety: { hasPain: false, painAreas: [] }
        })
        .select("id")
        .single();

      throwIfError(error);
      if (!data) {
        throw new Error("Supabase did not return a profile id.");
      }
      return { profileId: String(data.id) };
    },
    async saveProfile(input: ProfileInput & { id?: string }) {
      const payload = {
        ...(input.id ? { id: input.id } : {}),
        ...(input.displayName ? { display_name: input.displayName } : {}),
        language: input.language,
        goal: input.goal,
        fitness_level: input.fitnessLevel,
        equipment: input.equipment,
        weekly_schedule: input.weeklySchedule,
        safety: input.safety,
        ...(input.height !== undefined ? { height: input.height } : {}),
        ...(input.weight !== undefined ? { weight: input.weight } : {}),
        ...(input.targetWeight !== undefined ? { target_weight: input.targetWeight } : {}),
        ...(input.age !== undefined ? { age: input.age } : {}),
        ...(input.gender !== undefined ? { gender: input.gender } : {})
      };

      const { data, error } = await supabase.from("profiles").upsert(payload).select("*").single();
      throwIfError(error);
      return mapProfile(data as ProfileRow);
    },
    async getProfile(profileId?: string) {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(1);
      if (profileId) {
        query = query.eq("id", profileId);
      }

      const { data, error } = await query.maybeSingle();
      throwIfError(error);
      return data ? mapProfile(data as ProfileRow) : null;
    },
    async saveWorkoutSession(input: WorkoutSessionInput) {
      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
          profile_id: input.profileId,
          exercise: input.exercise,
          duration_seconds: input.durationSeconds,
          reps_completed: input.repsCompleted,
          confidence_avg: input.confidenceAvg,
          completion_status: input.completionStatus,
          safety_flag: input.safetyFlag,
          started_at: input.startedAt,
          ended_at: input.endedAt
        })
        .select("*")
        .single();

      throwIfError(error);
      return mapWorkoutSession(data as WorkoutSessionRow);
    },
    async listSessions(profileId: string) {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      throwIfError(error);
      return (data ?? []).map((row) => mapWorkoutSession(row as WorkoutSessionRow));
    },
    async savePoseEvent(input: PoseEventInput) {
      const { data, error } = await supabase
        .from("pose_events")
        .insert({
          profile_id: input.profileId,
          ...(input.sessionId ? { session_id: input.sessionId } : {}),
          event_type: input.eventType,
          ...(input.feedbackCode ? { feedback_code: input.feedbackCode } : {}),
          ...(input.confidence === undefined ? {} : { confidence: input.confidence }),
          metadata: input.metadata ?? {}
        })
        .select("*")
        .single();

      throwIfError(error);
      return mapPoseEvent(data as PoseEventRow);
    },
    async saveCoachReview(review: Omit<CoachReview, "id" | "createdAt">) {
      const { data, error } = await supabase
        .from("coach_reviews")
        .insert({
          profile_id: review.profileId,
          session_id: review.sessionId,
          summary_bn: review.summaryBn,
          summary_en: review.summaryEn,
          next_action: review.nextAction,
          form_focus: review.formFocus,
          safety_note: review.safetyNote,
          confidence_level: review.confidenceLevel,
          encouragement: review.encouragement,
          limitations: review.limitations
        })
        .select("*")
        .single();

      throwIfError(error);
      return mapCoachReview(data as CoachReviewRow);
    },
    async listCoachReviews(profileId) {
      const { data, error } = await supabase
        .from("coach_reviews")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });
      throwIfError(error);
      return (data as CoachReviewRow[]).map(mapCoachReview);
    },
    async createImageSession(profileId: string) {
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
      const imageSessionId = crypto.randomUUID();
      const uploadUrl = `/capture/${imageSessionId}`;
      const { data, error } = await supabase
        .from("image_sessions")
        .insert({
          id: imageSessionId,
          profile_id: profileId,
          status: "pending",
          upload_url: uploadUrl,
          expires_at: expiresAt
        })
        .select("*")
        .single();

      throwIfError(error);
      return mapImageSession(data as ImageSessionRow);
    },
    async getImageSession(id: string) {
      const { data, error } = await supabase.from("image_sessions").select("*").eq("id", id).maybeSingle();
      throwIfError(error);
      return data ? mapImageSession(data as ImageSessionRow) : null;
    },
    async updateImageSessionStatus(id, status) {
      const { data, error } = await supabase
        .from("image_sessions")
        .update({ status })
        .eq("id", id)
        .select("*")
        .single();
      throwIfError(error);
      return mapImageSession(data as ImageSessionRow);
    },
    async saveMealReview(review: Omit<MealReview, "id" | "createdAt">) {
      const { data, error } = await supabase
        .from("meal_reviews")
        .insert({
          profile_id: review.profileId,
          ...(review.imageSessionId ? { image_session_id: review.imageSessionId } : {}),
          probable_dishes: review.probableDishes,
          confidence_level: review.confidenceLevel,
          portion_questions: review.portionQuestions,
          ...(review.calorieRange ? { calorie_range: review.calorieRange } : {}),
          macro_notes: review.macroNotes,
          profile_signals: review.profileSignals,
          limitations: review.limitations
        })
        .select("*")
        .single();

      throwIfError(error);
      return mapMealReview(data as MealReviewRow);
    },
    async getMealReviewByImageSession(imageSessionId) {
      const { data, error } = await supabase
        .from("meal_reviews")
        .select("*")
        .eq("image_session_id", imageSessionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      throwIfError(error);
      return data ? mapMealReview(data as MealReviewRow) : null;
    }
  };
}
