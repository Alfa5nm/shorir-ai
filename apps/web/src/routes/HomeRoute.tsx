import type { Profile, WorkoutSession } from "@shorir/contracts";
import { CalendarDays, ChevronRight, Clock3, Dumbbell, Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppServices } from "../app/providers";
import { ensureProfileId } from "../app/profileSession";
import { Badge } from "../components/ui/badge";
import { ButtonLink } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { StatusPill } from "../components/ui/StatusPill";
import { createDailyWorkoutPlan } from "../features/daily-plan/dailyPlan";
import { demoSequence } from "../features/demo/demoSequence";

export function HomeRoute() {
  const { apiClient } = useAppServices();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [health, setHealth] = useState("checking");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([
      apiClient.getHealth().then((result) => setHealth(result.ok ? "connected" : "unhealthy")).catch(() => setHealth("offline")),
      ensureProfileId(apiClient).then(async (profileId) => {
        const [savedProfile, savedSessions] = await Promise.all([
          apiClient.getProfile(profileId),
          apiClient.listSessions(profileId)
        ]);
        if (!active) return;
        setProfile(savedProfile);
        setSessions(savedSessions.sort((a, b) => b.endedAt.localeCompare(a.endedAt)));
      })
    ]).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [apiClient]);

  const plan = useMemo(() => (profile ? createDailyWorkoutPlan(profile, sessions) : null), [profile, sessions]);

  if (isLoading) {
    return <section className="panel loading-state"><Loader2 className="spin" /> Preparing today&apos;s plan...</section>;
  }

  return (
    <section className="daily-dashboard">
      <header className="daily-dashboard__header">
        <div>
          <StatusPill tone={health === "connected" ? "success" : "warning"}>API {health}</StatusPill>
          <h1>{profile?.displayName ? `${profile.displayName}'s plan` : "Today's workout plan"}</h1>
          <p>{plan?.rationale ?? "Complete onboarding to generate a schedule-aware workout."}</p>
          <div className="daily-dashboard__hero-actions">
            <ButtonLink to="/demo">View demo flow</ButtonLink>
            <ButtonLink to="/coach?exercise=squat" variant="secondary">Open pose coach</ButtonLink>
          </div>
        </div>
        <img src="/images/logo_nobg.png" alt="SHORIR AI" />
      </header>

      <Card className="demo-strip">
        <CardHeader>
          <div>
            <Badge variant="secondary">Suggested walkthrough</Badge>
            <h2>Show the product in eight clean steps</h2>
          </div>
          <ButtonLink to="/demo" variant="ghost" size="sm">Open full demo</ButtonLink>
        </CardHeader>
        <CardContent>
          {demoSequence.slice(0, 5).map((step, index) => {
            const Icon = step.icon;
            return (
              <Link className="demo-strip__step" to={step.route} key={step.id}>
                <span>{index + 1}</span>
                <Icon size={17} aria-hidden={true} />
                <strong>{step.title}</strong>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {!profile || !plan ? (
        <div className="empty-state">
          <h2>Set up your coaching profile</h2>
          <p>Your goal, fitness level, schedule, equipment, safety flags, and recent sessions shape the daily plan.</p>
          <Link to="/onboarding">Open onboarding</Link>
        </div>
      ) : (
        <>
          <div className="daily-plan-summary">
            <article>
              <CalendarDays size={20} />
              <span>Today</span>
              <strong>{plan.title}</strong>
            </article>
            <article>
              <Clock3 size={20} />
              <span>Estimated time</span>
              <strong>{plan.estimatedMinutes} min</strong>
            </article>
            <article>
              <Dumbbell size={20} />
              <span>Exercises</span>
              <strong>{plan.items.length}</strong>
            </article>
          </div>

          {profile.safety.hasPain && (
            <div className="daily-plan-safety">
              <ShieldAlert size={20} />
              <p>Pain or a movement limitation is saved in your profile. Use a pain-free range and seek qualified guidance when needed.</p>
            </div>
          )}

          {plan.items.length > 0 ? (
            <div className="daily-plan-list">
              {plan.items.map((item, index) => (
                <article key={item.exercise}>
                  <span className="daily-plan-list__order">{index + 1}</span>
                  <div>
                    <h2>{item.name}</h2>
                    <p>{item.note}</p>
                  </div>
                  <strong>{item.sets} x {item.targetReps}</strong>
                  <Link to={`/coach?exercise=${encodeURIComponent(item.exercise)}`} aria-label={`Coach ${item.name}`}>
                    <ChevronRight size={20} />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>{plan.title}</h2>
              <p>{plan.rationale}</p>
              <Link to="/exercise-library">Browse light movement guides</Link>
            </div>
          )}

          <nav className="daily-dashboard__links" aria-label="Dashboard shortcuts">
            <Link to="/exercise-library">Exercise library</Link>
            <Link to="/diet-chart">Diet chart</Link>
            <Link to="/calorie-check">Calorie check</Link>
            <Link to="/progress">Progress history</Link>
          </nav>
        </>
      )}
    </section>
  );
}
