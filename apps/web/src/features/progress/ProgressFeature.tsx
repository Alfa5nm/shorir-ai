import type { CoachReview, WorkoutSession } from "@shorir/contracts";
import { Activity, Dumbbell, Loader2, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppServices } from "../../app/providers";
import { ensureProfileId } from "../../app/profileSession";
import { StatusPill } from "../../components/ui/StatusPill";

export function ProgressFeature() {
  const { apiClient } = useAppServices();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [reviews, setReviews] = useState<CoachReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void ensureProfileId(apiClient)
      .then(async (profileId) => {
        const [sessionResult, reviewResult] = await Promise.all([
          apiClient.listSessions(profileId),
          apiClient.listCoachReviews(profileId)
        ]);
        if (!active) return;
        setSessions(sessionResult.sort((a, b) => b.endedAt.localeCompare(a.endedAt)));
        setReviews(reviewResult);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load progress.");
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

  if (isLoading) {
    return <section className="panel loading-state"><Loader2 className="spin" /> Loading progress...</section>;
  }

  return (
    <section className="progress-dashboard">
      <header className="feature-header">
        <StatusPill tone={error ? "warning" : sessions.length ? "success" : "neutral"}>
          {sessions.length ? "Sessions saved" : "No sessions yet"}
        </StatusPill>
        <h1>Your progress</h1>
        <p>Derived workout summaries and coach feedback from this browser profile.</p>
      </header>

      {error && <p className="inline-error">{error}</p>}

      <div className="progress-metrics">
        <article><Activity /><span>Sessions</span><strong>{sessions.length}</strong></article>
        <article><Dumbbell /><span>Total reps</span><strong>{totals.reps}</strong></article>
        <article><Target /><span>Avg. confidence</span><strong>{Math.round(totals.confidence * 100)}%</strong></article>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <h2>Complete your first coached session</h2>
          <p>Calibrate the camera, perform a squat, and select End and review.</p>
          <a href="/coach">Open pose coach</a>
        </div>
      ) : (
        <div className="progress-columns">
          <section>
            <h2>Recent workouts</h2>
            <div className="session-list">
              {sessions.slice(0, 8).map((session) => (
                <article key={session.id}>
                  <div>
                    <strong>{session.exercise}</strong>
                    <span>{new Date(session.endedAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <strong>{session.repsCompleted} reps</strong>
                    <span>{Math.round(session.confidenceAvg * 100)}% confidence</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section>
            <h2>Coach focus</h2>
            {reviews.length ? (
              <div className="review-list">
                {reviews.slice(0, 5).map((review) => (
                  <article key={review.id}>
                    <strong>{review.nextAction}</strong>
                    <p>{review.formFocus.join(", ")}</p>
                  </article>
                ))}
              </div>
            ) : <p className="muted-copy">Coach reviews appear after completed sessions.</p>}
          </section>
        </div>
      )}
    </section>
  );
}
