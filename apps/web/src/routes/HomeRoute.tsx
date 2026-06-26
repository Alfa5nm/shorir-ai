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
import { useAppLanguage } from "../app/language";

export function HomeRoute() {
  const { apiClient } = useAppServices();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [health, setHealth] = useState("checking");
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useAppLanguage();

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

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDayName = dayNames[new Date().getDay()]!;

  const translateDayName = (day: string) => {
    const mapping: Record<string, string> = {
      "Sunday": "রবিবার",
      "Monday": "সোমবার",
      "Tuesday": "মঙ্গলবার",
      "Wednesday": "বুধবার",
      "Thursday": "বৃহস্পতিবার",
      "Friday": "শুক্রবার",
      "Saturday": "শনিবার"
    };
    return mapping[day] || day;
  };

  const translatePlanTitle = (title: string) => {
    if (title === "Recovery day") return t("Recovery day", "পুনরুদ্ধার দিবস (বিশ্রাম)");
    if (title === "Conservative movement check") return t("Conservative movement check", "রক্ষণশীল মুভমেন্ট চেক");
    if (title === "Strength foundation") return t("Strength foundation", "শক্তি বৃদ্ধির ভিত্তি");
    if (title === "Today's guided session") return t("Today's guided session", "আজকের নির্দেশিত সেশন");
    return title;
  };

  const translatePlanRationale = (rationale: string) => {
    if (rationale.startsWith("Your saved schedule does not include")) {
      return t(
        rationale,
        `আপনার সংরক্ষিত সময়সূচীতে ${translateDayName(todayDayName)} অন্তর্ভুক্ত নয়। আরামদায়ক হলে হালকা হাঁটা বা গতিশীলতা চর্চা করতে পারেন।`
      );
    }
    if (rationale === "You reported pain or a movement limitation. Keep the session short and stop if symptoms increase.") {
      return t(
        rationale,
        "আপনি ব্যথা বা মুভমেন্টের সীমাবদ্ধতা রিপোর্ট করেছেন। সেশনটি ছোট রাখুন এবং লক্ষণগুলো বাড়লে অবিলম্বে বন্ধ করুন।"
      );
    }
    if (rationale.startsWith("Built for your")) {
      return t(
        rationale,
        "আপনার ফিটনেস স্তর এবং সাম্প্রতিক কোচেড সেশনের ভারসাম্যের ওপর ভিত্তি করে তৈরি।"
      );
    }
    return rationale;
  };

  const translateItemName = (name: string) => {
    if (name === "Supported range squat") return t("Supported range squat", "সমর্থিত রেঞ্জ স্কোয়াট");
    if (name === "Bodyweight squat") return t("Bodyweight squat", "বডিওয়েট স্কোয়াট");
    if (name === "Push-up") return t("Push-up", "পুশ-আপ");
    if (name === "Forward lunge") return t("Forward lunge", "ফরোয়ার্ড লাঞ্জ");
    return name;
  };

  const translateItemNote = (note: string) => {
    if (note === "Use a pain-free range and stable support. This is not medical guidance.") {
      return t(
        note,
        "ব্যথামুক্ত রেঞ্জ এবং স্থিতিশীল সমর্থন ব্যবহার করুন। এটি কোনো চিকিৎসা নির্দেশনা নয়।"
      );
    }
    if (note === "Complete the target on each side with a stable split stance.") {
      return t(
        note,
        "একটি স্থিতিশীল স্প্লিট স্ট্যান্সের সাহায্যে প্রতিটি পাশে লক্ষ্য সম্পন্ন করুন।"
      );
    }
    if (note === "Use the live coach and stop the set when form becomes unstable.") {
      return t(
        note,
        "লাইভ কোচ ব্যবহার করুন এবং ফর্মটি অস্থিতিশীল হয়ে পড়লে সেটটি বন্ধ করুন।"
      );
    }
    return note;
  };

  const translateStepTitle = (title: string) => {
    const map: Record<string, string> = {
      "Profile setup": "প্রোফাইল সেটআপ",
      "Daily command center": "কমান্ড সেন্টার",
      "Strict pose coach": "পোজ কোচ",
      "Movement library": "মুভমেন্ট লাইব্রেরি",
      "Bangladeshi diet chart": "ডায়েট চার্ট"
    };
    return t(title, map[title] || title);
  };

  if (isLoading) {
    return <section className="panel loading-state"><Loader2 className="spin" /> {t("Preparing today's plan...", "আজকের পরিকল্পনা প্রস্তুত করা হচ্ছে...")}</section>;
  }

  return (
    <section className="daily-dashboard">
      <header className="daily-dashboard__header">
        <div>
          <StatusPill tone={health === "connected" ? "success" : "warning"}>
            {health === "connected"
              ? t("API connected", "এপিআই সংযুক্ত")
              : health === "offline"
              ? t("API offline", "এপিআই অফলাইন")
              : t("API unhealthy", "এপিআই ত্রুটিপূর্ণ")}
          </StatusPill>
          <h1>
            {profile?.displayName
              ? t(`${profile.displayName}'s plan`, `${profile.displayName}-এর পরিকল্পনা`)
              : t("Today's workout plan", "আজকের ওয়ার্কআউট পরিকল্পনা")}
          </h1>
          <p>
            {plan
              ? translatePlanRationale(plan.rationale)
              : t("Complete onboarding to generate a schedule-aware workout.", "একটি সময়সূচী-সচেতন ওয়ার্কআউট তৈরি করতে অনবোর্ডিং সম্পন্ন করুন।")}
          </p>
          <div className="daily-dashboard__hero-actions">
            <ButtonLink to="/demo">{t("View demo flow", "ডেমো ফ্লো দেখুন")}</ButtonLink>
            <ButtonLink to="/coach?exercise=squat" variant="secondary">{t("Open pose coach", "পোজ কোচ খুলুন")}</ButtonLink>
          </div>
        </div>
        <img src="/images/logo_nobg.png" alt="SHORIR AI" />
      </header>

      <Card className="demo-strip">
        <CardHeader>
          <div>
            <Badge variant="secondary">{t("Suggested walkthrough", "পরামর্শিত ওয়াকথ্রু")}</Badge>
            <h2>{t("Show the product in eight clean steps", "আটটি পরিষ্কার ধাপে প্রোডাক্টের কার্যকারিতা দেখুন")}</h2>
          </div>
          <ButtonLink to="/demo" variant="ghost" size="sm">{t("Open full demo", "সম্পূর্ণ ডেমো খুলুন")}</ButtonLink>
        </CardHeader>
        <CardContent>
          {demoSequence.slice(0, 5).map((step, index) => {
            const Icon = step.icon;
            return (
              <Link className="demo-strip__step" to={step.route} key={step.id}>
                <span>{index + 1}</span>
                <Icon size={17} aria-hidden={true} />
                <strong>{translateStepTitle(step.title)}</strong>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {!profile || !plan ? (
        <div className="empty-state">
          <h2>{t("Set up your coaching profile", "আপনার কোচিং প্রোফাইল সেট আপ করুন")}</h2>
          <p>{t("Your goal, fitness level, schedule, equipment, safety flags, and recent sessions shape the daily plan.", "আপনার লক্ষ্য, ফিটনেস স্তর, সময়সূচী, সরঞ্জাম, নিরাপত্তা ফ্ল্যাগ এবং সাম্প্রতিক সেশনগুলো আজকের পরিকল্পনা তৈরি করতে সাহায্য করে।")}</p>
          <Link to="/onboarding">{t("Open onboarding", "অনবোর্ডিং শুরু করুন")}</Link>
        </div>
      ) : (
        <>
          <div className="daily-plan-summary">
            <article>
              <CalendarDays size={20} />
              <span>{t("Today", "আজ")}</span>
              <strong>{translatePlanTitle(plan.title)}</strong>
            </article>
            <article>
              <Clock3 size={20} />
              <span>{t("Estimated time", "আনুমানিক সময়")}</span>
              <strong>{plan.estimatedMinutes} {t("min", "মিনিট")}</strong>
            </article>
            <article>
              <Dumbbell size={20} />
              <span>{t("Exercises", "ব্যায়াম সমূহ")}</span>
              <strong>{plan.items.length}</strong>
            </article>
          </div>

          {profile.safety.hasPain && (
            <div className="daily-plan-safety">
              <ShieldAlert size={20} />
              <p>{t("Pain or a movement limitation is saved in your profile. Use a pain-free range and seek qualified guidance when needed.", "আপনার প্রোফাইলে ব্যথা বা চলাফেরার সীমাবদ্ধতা সংরক্ষিত রয়েছে। ব্যথামুক্ত মুভমেন্ট রেঞ্জ ব্যবহার করুন এবং প্রয়োজনে কোচের পরামর্শ নিন।")}</p>
            </div>
          )}

          {plan.items.length > 0 ? (
            <div className="daily-plan-list">
              {plan.items.map((item, index) => (
                <article key={item.exercise}>
                  <span className="daily-plan-list__order">{index + 1}</span>
                  <div>
                    <h2>{translateItemName(item.name)}</h2>
                    <p>{translateItemNote(item.note)}</p>
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
              <h2>{translatePlanTitle(plan.title)}</h2>
              <p>{translatePlanRationale(plan.rationale)}</p>
              <Link to="/exercise-library">{t("Browse light movement guides", "হালকা মুভমেন্ট গাইডগুলো ব্রাউজ করুন")}</Link>
            </div>
          )}

          <nav className="daily-dashboard__links" aria-label="Dashboard shortcuts">
            <Link to="/exercise-library">{t("Exercise library", "ব্যায়াম লাইব্রেরি")}</Link>
            <Link to="/diet-chart">{t("Diet chart", "ডায়েট চার্ট")}</Link>
            <Link to="/calorie-check">{t("Calorie check", "ক্যালোরি চেক")}</Link>
            <Link to="/progress">{t("Progress history", "অগ্রগতির ইতিহাস")}</Link>
          </nav>
        </>
      )}
    </section>
  );
}
