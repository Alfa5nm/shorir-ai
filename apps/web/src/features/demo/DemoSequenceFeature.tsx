import { ArrowLeft, ArrowRight, ExternalLink, Pause, Play, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import { Button, ButtonLink } from "../../components/ui/button";
import { demoSequence, type DemoScene } from "./demoSequence";
import { useAppLanguage } from "../../app/language";

function percent(value: number) {
  return `${value}%`;
}

function sceneStyle(scene: DemoScene, isPlaying: boolean) {
  const [from, to] = scene.cursorPath;
  return {
    "--demo-duration": `${scene.durationMs}ms`,
    "--target-x": percent(scene.targetRect.x),
    "--target-y": percent(scene.targetRect.y),
    "--target-w": percent(scene.targetRect.width),
    "--target-h": percent(scene.targetRect.height),
    "--cursor-from-x": percent(from.x),
    "--cursor-from-y": percent(from.y),
    "--cursor-to-x": percent(to.x),
    "--cursor-to-y": percent(to.y),
    "--demo-play-state": isPlaying ? "running" : "paused"
  } as CSSProperties;
}

export function DemoSequenceFeature() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialScene = searchParams.get("scene");
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, demoSequence.findIndex((scene) => scene.id === initialScene))
  );
  const [isPlaying, setIsPlaying] = useState(true);
  const { t } = useAppLanguage();
  const activeScene = demoSequence[activeIndex] ?? demoSequence[0]!;
  const progressLabel = `${activeIndex + 1} / ${demoSequence.length}`;
  const stageStyle = useMemo(() => sceneStyle(activeScene, isPlaying), [activeScene, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % demoSequence.length);
    }, activeScene.durationMs);
    return () => window.clearTimeout(timeout);
  }, [activeScene.durationMs, activeIndex, isPlaying]);

  function goTo(index: number) {
    const nextIndex = (index + demoSequence.length) % demoSequence.length;
    setActiveIndex(nextIndex);
    setSearchParams(
      nextIndex === 0 ? {} : { scene: demoSequence[nextIndex]!.id },
      { replace: true }
    );
  }

  function previous() {
    goTo(activeIndex - 1);
  }

  function next() {
    goTo(activeIndex + 1);
  }

  const translateSceneTitle = (title: string) => {
    const map: Record<string, string> = {
      "Profile setup": "প্রোফাইল সেটআপ",
      "Daily command center": "দৈনিক কমান্ড সেন্টার",
      "Strict pose coach": "সরাসরি পোজ কোচ",
      "Movement library": "ব্যায়াম লাইব্রেরি",
      "Bangladeshi diet chart": "বাংলাদেশী খাদ্য তালিকা",
      "Calorie check": "ক্যালোরি চেক",
      "Progress review": "অগ্রগতি পর্যালোচনা",
      "Submission package": "জমা দেওয়ার প্যাকেজ"
    };
    return t(title, map[title] || title);
  };

  const translateSceneCaption = (caption: string) => {
    const map: Record<string, string> = {
      "The first touchpoint starts with one guided profile layer instead of a long setup wall.": "প্রথম ধাপটি একটি দীর্ঘ সেটআপ প্রাচীরের পরিবর্তে একটি নির্দেশিত প্রোফাইল লেয়ার দিয়ে শুরু হয়।",
      "The dashboard answers the first user question immediately: what should I do next?": "ড্যাশবোর্ড তাৎক্ষণিকভাবে ব্যবহারকারীর প্রথম প্রশ্নের উত্তর দেয়: এরপর আমার কী করা উচিত?",
      "Camera, movement guide, and rep controls are separated so testers see exactly what is being judged.": "ক্যামেরা, মুভমেন্ট গাইড এবং রিপিটেশন নিয়ন্ত্রণ আলাদা করা হয়েছে যাতে পরীক্ষকরা স্পষ্টভাবে দেখতে পারেন কী বিচার করা হচ্ছে।",
      "The exercise library gives setup, safety, and camera guidance before the live coach starts.": "লাইভ কোচ শুরু করার আগে ব্যায়াম লাইব্রেরি সেটআপ, নিরাপত্তা এবং ক্যামেরা নির্দেশিকা প্রদান করে।",
      "Nutrition feels local: familiar meals, calorie ranges, and macros are organized into a calm plan.": "পুষ্টিকে দেশীয় মনে হবে: পরিচিত খাবার, ক্যালোরি পরিসীমা এবং ম্যাক্রো পুষ্টি একটি শান্ত পরিকল্পনায় সাজানো হয়েছে।",
      "Food review supports desktop upload and phone capture without forcing a separate mobile app.": "খাবার পর্যালোচনা আলাদা কোনো মোবাইল অ্যাপের প্রয়োজনীয়তা ছাড়াই ডেস্কটপ আপলোড এবং ফোন ক্যাপচার সমর্থন করে।",
      "Progress closes the loop by showing sessions, coach reviews, and detector quality trends.": "অগ্রগতি পূর্ববর্তী সেশন, কোচের পর্যালোচনা এবং সনাক্তকরণের মানের ধারা প্রদর্শন করে লুপটি সম্পূর্ণ করে।",
      "The final scene points judges back to the upload-ready files: live URL, deck, report, and source ZIP.": "চূড়ান্ত দৃশ্যটি বিচারকদের আপলোড-প্রস্তুত ফাইলগুলোর দিকে নির্দেশ করে: লাইভ ইউআরএল, ডেক, রিপোর্ট এবং সোর্স জিপ।"
    };
    return t(caption, map[caption] || caption);
  };

  const translateSceneCallout = (callout: string) => {
    const map: Record<string, string> = {
      "Language, goal, schedule, body metrics, and safety all become personalized context.": "ভাষা, লক্ষ্য, সময়সূচী, শরীরের পরিমাপ এবং নিরাপত্তা সবই ব্যক্তিগতকৃত প্রেক্ষাপটে পরিণত হয়।",
      "Plan cards, safety context, and shortcuts stay scan-friendly for first-time users.": "নতুন ব্যবহারকারীদের জন্য প্ল্যান কার্ড, নিরাপত্তা প্রসঙ্গ এবং শর্টকাটগুলো সহজে পড়ার উপযোগী থাকে।",
      "False reps are avoided with quality gates, stable posture, and ordered movement phases.": "কোয়ালিটি গেট, স্থিতিশীল ভঙ্গি এবং সুশৃঙ্খল মুভমেন্ট ফেজের মাধ্যমে ভুল রিপিটেশন এড়ানো হয়।",
      "Supported guides can jump directly into the strict live coach route.": "সমর্থিত গাইডগুলো সরাসরি লাইভ কোচের রুটে চলে যেতে পারে।",
      "The product stays clear that this is planning guidance, not medical advice.": "পণ্যটি স্পষ্টভাবে জানিয়ে দেয় যে এটি শুধুমাত্র একটি পরিকল্পনার নির্দেশিকা, কোনো চিকিৎসাগত পরামর্শ নয়।",
      "The result emphasizes cautious estimates, confidence, and next action.": "ফলাফলটি সতর্কতামূলক অনুমান, সনাক্তকরণের বিশ্বাসযোগ্যতা এবং পরবর্তী পদক্ষেপের ওপর জোর দেয়।",
      "Users can see what was accepted, paused, rejected, and improved over time.": "ব্যবহারকারীরা দেখতে পাবেন কী গৃহীত, স্থগিত, প্রত্যাখ্যাত এবং সময়ের সাথে উন্নত হয়েছে।",
      "Judges get a complete product story and a complete delivery package.": "বিচারকগণ একটি সম্পূর্ণ পণ্যের গল্প এবং একটি সম্পূর্ণ ডেলিভারি প্যাকেজ পান।"
    };
    return t(callout, map[callout] || callout);
  };

  const Icon = activeScene.icon;

  return (
    <section className="demo-page demo-page--interactive">
      <header className="feature-header demo-page__header demo-hero">
        <Badge variant="secondary">{t("Interactive showcase", "ইন্টারেক্টিভ শোকেস")}</Badge>
        <h1>{t("Guided product tour", "নির্দেশিত পণ্য সফর")}</h1>
        <p>
          {t("A cinematic walkthrough for judges and first-time users, with live highlights, focal depth, and a guided cursor that points to the product story without turning the screen into a checklist.", "বিচারক এবং নতুন ব্যবহারকারীদের জন্য একটি সিনেমাটিক ওয়াকথ্রু, যেখানে লাইভ হাইলাইট, ফোকাল ডেপথ এবং একটি গাইডেড কার্সার রয়েছে যা স্ক্রিনটিকে কেবল একটি চেকলিস্টে পরিণত না করে পণ্যের গল্পটিকে নির্দেশ করে।")}
        </p>
        <div className="demo-page__actions">
          <ButtonLink to="/onboarding">{t("Start profile setup", "প্রোফাইল সেটআপ শুরু করুন")}</ButtonLink>
          <ButtonLink to="/coach?exercise=squat" variant="secondary">{t("Jump to coach", "কোচে যান")}</ButtonLink>
        </div>
      </header>

      <div className="demo-tour-shell">
        <aside className="demo-tour-rail" aria-label="Demo scenes">
          <div className="demo-tour-rail__header">
            <Sparkles size={18} aria-hidden="true" />
            <span>{t("Tour scenes", "ট্যুর দৃশ্যসমূহ")}</span>
          </div>
          {demoSequence.map((scene, index) => {
            const StepIcon = scene.icon;
            return (
              <button
                key={scene.id}
                type="button"
                className={index === activeIndex ? "is-active" : ""}
                onClick={() => goTo(index)}
                aria-current={index === activeIndex ? "step" : undefined}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <StepIcon size={17} aria-hidden="true" />
                <strong>{translateSceneTitle(scene.title)}</strong>
              </button>
            );
          })}
        </aside>

        <article className="demo-tour-stage" style={stageStyle}>
          <div className="demo-tour-stage__topline">
            <div>
              <span>{progressLabel}</span>
              <h2>{translateSceneTitle(activeScene.title)}</h2>
            </div>
            <Link to={activeScene.route}>
              {t("Open live route", "লাইভ রুট খুলুন")}
              <ExternalLink size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="demo-viewport" key={activeScene.id}>
            <img src={activeScene.frame} alt={`${translateSceneTitle(activeScene.title)} app preview`} />
            <div className="demo-viewport__veil" aria-hidden="true" />
            <div className="demo-viewport__spotlight" aria-hidden="true" />
            <div className="demo-viewport__target" aria-hidden="true" />
            <div className="demo-viewport__cursor" aria-hidden="true">
              <svg viewBox="0 0 28 28" role="img">
                <path d="M4 2.8 23.5 14 15 16.2 11.7 25 4 2.8Z" />
              </svg>
            </div>
            <div className="demo-viewport__caption">
              <Icon size={20} aria-hidden="true" />
              <p>{translateSceneCaption(activeScene.caption)}</p>
            </div>
          </div>

          <div className="demo-tour-copy">
            <div>
              <span>{t("Focus point", "ফোকাস পয়েন্ট")}</span>
              <strong>{translateSceneCallout(activeScene.callout)}</strong>
            </div>
            <div className="demo-tour-controls" aria-label="Tour playback controls">
              <Button type="button" variant="outline" size="sm" onClick={previous}>
                <ArrowLeft size={16} aria-hidden="true" />
                {t("Back", "পেছনে")}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsPlaying((current) => !current)}>
                {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                {isPlaying ? t("Pause", "থামুন") : t("Play", "চালান")}
              </Button>
              <Button type="button" size="sm" onClick={next}>
                {t("Next", "পরবর্তী")}
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="demo-tour-progress" aria-hidden="true">
            <span key={`${activeScene.id}-${isPlaying ? "playing" : "paused"}`} />
          </div>
        </article>
      </div>
    </section>
  );
}
