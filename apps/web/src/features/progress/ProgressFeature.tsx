import type { CoachReview, PoseEvent, WorkoutSession } from "@shorir/contracts";
import { Activity, Dumbbell, Loader2, ScanLine, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppServices } from "../../app/providers";
import { ensureProfileId } from "../../app/profileSession";
import { StatusPill } from "../../components/ui/StatusPill";
import { diagnosticsBySession } from "./progressDiagnostics";
import { useAppLanguage } from "../../app/language";

export function ProgressFeature() {
  const { apiClient } = useAppServices();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [reviews, setReviews] = useState<CoachReview[]>([]);
  const [events, setEvents] = useState<PoseEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useAppLanguage();

  useEffect(() => {
    let active = true;
    void ensureProfileId(apiClient)
      .then(async (profileId) => {
        const [sessionResult, reviewResult, eventResult] = await Promise.all([
          apiClient.listSessions(profileId),
          apiClient.listCoachReviews(profileId),
          apiClient.listPoseEvents(profileId)
        ]);
        if (!active) return;
        setSessions(sessionResult.sort((a, b) => b.endedAt.localeCompare(a.endedAt)));
        setReviews(reviewResult);
        setEvents(eventResult);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : t("Unable to load progress.", "অগ্রগতি লোড করা সম্ভব হয়নি।"));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiClient]);

  const totals = useMemo(() => {
    const reps = sessions.reduce((sum, session) => sum + session.repsCompleted, 0);
    const confidence = sessions.length
      ? sessions.reduce((sum, session) => sum + session.confidenceAvg, 0) / sessions.length
      : 0;
    return { reps, confidence };
  }, [sessions]);
  const diagnostics = useMemo(() => diagnosticsBySession(events), [events]);

  const translateExercise = (ex: string) => {
    if (ex === "squat") return t("squat", "স্কোয়াট");
    if (ex === "push-up") return t("push-up", "পুশ-আপ");
    if (ex === "lunge") return t("lunge", "লাঞ্জ");
    return ex;
  };

  const translateReason = (reason: string) => {
    const map: Record<string, string> = {
      "Low landmark confidence": "নিম্ন ল্যান্ডমার্ক আত্মবিশ্বাস (দুর্বল সনাক্তকরণ)",
      "Left the activity area": "কার্যকলাপ এলাকা ছেড়ে বের হয়ে গেছেন",
      "Too close to the camera": "ক্যামেরার খুব কাছাকাছি ছিলেন",
      "Too far from the camera": "ক্যামেরা থেকে খুব দূরে ছিলেন",
      "Hips sagged": "কোমর ঝুলে গিয়েছিল",
      "Hips were too high": "কোমর খুব উঁচুতে ছিল",
      "Shoulder and wrist misaligned": "কাঁধ এবং কব্জি সমান্তরালে ছিল না",
      "Pose moved too abruptly": "শরীর খুব দ্রুত নড়াচড়া করেছিল",
      "Body was not side-on": "শরীর পার্শ্ব-মুখী (সাইড-অন) ছিল না",
      "Top position was not stable": "উপরের অবস্থানটি স্থিতিশীল ছিল না",
      "Depth was not confirmed": "সহজ গভীরতা নিশ্চিত করা যায়নি",
      "Shallow rep": "অগভীব রিপিটেশন",
      "Pose was not stable": "পোজ স্থিতিশীল ছিল না"
    };
    return t(reason, map[reason] || reason);
  };

  const translateNextAction = (action: string) => {
    const map: Record<string, string> = {
      "Keep the same setup and move through each rep with steady control.": "একই সেটআপ রাখুন এবং প্রতিটি রিপিটেশন স্থির নিয়ন্ত্রণে সম্পন্ন করুন।",
      "Improve lighting and keep every required joint visible.": "আলোর মান উন্নত করুন এবং প্রতিটি প্রয়োজনীয় জয়েন্ট দৃশ্যমান রাখুন।",
      "Move the camera back and stay centered inside the activity box.": "ক্যামেরাটি পেছনে নিন এবং কার্যকলাপ বক্সের মাঝখানে থাকুন।",
      "Move the camera farther away and recalibrate.": "ক্যামেরাটি আরও দূরে সরিয়ে পুনরায় ক্যালিব্রেট করুন।",
      "Move closer to the camera and recalibrate.": "ক্যামেরার কাছাকাছি এসে পুনরায় ক্যালিব্রেট করুন।",
      "Turn fully side-on before recalibrating.": "পুনরায় ক্যালিব্রেট করার আগে পুরোপুরি পাশে ঘুরে দাঁড়ান।",
      "Slow down and hold the top position before each rep.": "গতি কমিয়ে প্রতিটি রিপিটেশনের আগে শুরুর অবস্থানে একটু থামুন।",
      "Use a controlled descent and briefly confirm the bottom position.": "নিয়ন্ত্রিত গতিতে নিচে নামুন এবং নিচের অবস্থানে ক্ষণিকের জন্য থামুন।",
      "Keep shoulders, hips, and ankles in one line throughout the push-up.": "পুশ-আপের সময় কাঁধ, কোমর এবং গোড়ালি এক লাইনে সোজা রাখুন।",
      "Place the camera side-on and stack each shoulder over its wrist.": "ক্যামেরাটি পাশে রাখুন এবং প্রতিটি কাঁধ যেন কব্জির ঠিক ওপরে থাকে তা নিশ্চিত করুন।",
      "Recalibrate with a clear side view, then use slower, deliberate reps.": "একটি পার্শ্ব দৃশ্য ব্যবহার করে পুনরায় ক্যালিব্রেট করুন, তারপর রিপিটেশন ধীর করুন।"
    };
    return t(action, map[action] || action);
  };

  const translateCoachNextAction = (action: string) => {
    if (action.startsWith("Repeat one short") && action.endsWith("set after reviewing your setup.")) {
      const exercise = action.replace("Repeat one short ", "").replace(" set after reviewing your setup.", "");
      const translatedExercise = translateExercise(exercise);
      return t(
        action,
        `আপনার সেটআপ পর্যালোচনা করার পর একটি সংক্ষিপ্ত ${translatedExercise} সেট পুনরাবৃত্তি করুন।`
      );
    }
    return action;
  };

  const translateFormFocus = (item: string) => {
    const map: Record<string, string> = {
      "Straight plank": "সোজা প্ল্যাঙ্ক",
      "Controlled depth": "নিয়ন্ত্রিত গভীরতা",
      "Shoulders over wrists": "কব্জির ওপরে কাঁধ",
      "Controlled tempo": "নিয়ন্ত্রিত গতি",
      "Stable stance": "স্থিতিশীল স্ট্যান্স",
      "Confidence-aware feedback": "সনাক্তকরণ নির্ভর প্রতিক্রিয়া"
    };
    return t(item, map[item] || item);
  };

  if (isLoading) {
    return <section className="panel loading-state"><Loader2 className="spin" /> {t("Loading progress...", "অগ্রগতি লোড করা হচ্ছে...")}</section>;
  }

  return (
    <section className="progress-dashboard">
      <header className="feature-header">
        <StatusPill tone={error ? "warning" : sessions.length ? "success" : "neutral"}>
          {sessions.length ? t("Sessions saved", "সেশন সংরক্ষিত") : t("No sessions yet", "এখনো কোনো সেশন নেই")}
        </StatusPill>
        <h1>{t("Your progress", "আপনার অগ্রগতি")}</h1>
        <p>{t("Derived workout summaries and coach feedback from this browser profile.", "এই ব্রাউজার প্রোফাইল থেকে প্রাপ্ত ওয়ার্কআউট সারাংশ এবং কোচের প্রতিক্রিয়া।")}</p>
      </header>

      {error && <p className="inline-error">{error}</p>}

      <div className="progress-metrics">
        <article><Activity /><span>{t("Sessions", "সেশন সমূহ")}</span><strong>{sessions.length}</strong></article>
        <article><Dumbbell /><span>{t("Total reps", "মোট রিপিটেশন")}</span><strong>{totals.reps}</strong></article>
        <article><Target /><span>{t("Avg. confidence", "গড় আত্মবিশ্বাস")}</span><strong>{Math.round(totals.confidence * 100)}%</strong></article>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <h2>{t("Complete your first coached session", "আপনার প্রথম কোচেড সেশন সম্পন্ন করুন")}</h2>
          <p>{t("Choose an exercise, calibrate the camera, complete a controlled set, and select End and review.", "একটি ব্যায়াম চয়ন করুন, ক্যামেরা ক্যালিব্রেট করুন, একটি নিয়ন্ত্রিত সেট সম্পন্ন করুন এবং 'End and review' নির্বাচন করুন।")}</p>
          <a href="/coach">{t("Open pose coach", "পোজ কোচ খুলুন")}</a>
        </div>
      ) : (
        <div className="progress-columns">
          <section>
            <h2>{t("Recent workouts", "সাম্প্রতিক ওয়ার্কআউট")}</h2>
            <div className="session-list">
              {sessions.slice(0, 8).map((session) => (
                <article key={session.id}>
                  <div>
                    <strong>{translateExercise(session.exercise)}</strong>
                    <span>{new Date(session.endedAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <strong>{session.repsCompleted} {t("reps", "রিপস")}</strong>
                    <span>{Math.round(session.confidenceAvg * 100)}% {t("confidence", "আত্মবিশ্বাস")}</span>
                    {diagnostics.get(session.id) && (
                      <span className="session-diagnostic">
                        <ScanLine size={14} />
                        {diagnostics.get(session.id)!.qualityScore}% {t("quality", "মান")}
                        {diagnostics.get(session.id)!.rejectedAttempts > 0
                          ? ` / ${diagnostics.get(session.id)!.rejectedAttempts} ${t("rejected", "প্রত্যাখ্যাত")}`
                          : ""}
                      </span>
                    )}
                  </div>
                  {diagnostics.get(session.id)?.topIssues[0] && (
                    <p className="session-list__diagnostic">
                      {t("Main pause:", "প্রধান বিরতি:")} {translateReason(diagnostics.get(session.id)!.topIssues[0]!.reason)}.{" "}
                      {translateNextAction(diagnostics.get(session.id)!.nextAction)}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
          <section>
            <h2>{t("Coach focus", "কোচের ফোকাস")}</h2>
            {reviews.length ? (
              <div className="review-list">
                {reviews.slice(0, 5).map((review) => (
                  <article key={review.id}>
                    <strong>{translateCoachNextAction(review.nextAction)}</strong>
                    <p>{review.formFocus.map(translateFormFocus).join(", ")}</p>
                  </article>
                ))}
              </div>
            ) : <p className="muted-copy">{t("Coach reviews appear after completed sessions.", "সেশন সম্পন্ন হওয়ার পর কোচের পর্যালোচনা এখানে প্রদর্শিত হবে।")}</p>}
          </section>
        </div>
      )}
    </section>
  );
}
