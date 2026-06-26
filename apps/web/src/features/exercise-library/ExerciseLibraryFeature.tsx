import { ArrowRight, BookOpen, Dumbbell, Filter, MapPin, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StatusPill } from "../../components/ui/StatusPill";
import { exerciseGuideById, exerciseGuides, liveCoachPath } from "./exerciseGuides";
import { useAppLanguage } from "../../app/language";

type DifficultyFilter = string | "all";
type EquipmentFilter = string | "all";
type LocationFilter = string | "all";

const exerciseAssetBaseUrl = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/master/";

function GuideSection({ title, items, translateStep }: { title: string; items: string[]; translateStep: (s: string) => string }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3>{title}</h3>
      <ul>{items.map((step) => <li key={step}>{translateStep(step)}</li>)}</ul>
    </section>
  );
}

export function ExerciseLibraryFeature() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>("all");
  const { t } = useAppLanguage();
  
  const requestedGuide = exerciseGuideById(searchParams.get("guide"));

  const equipmentOptions = useMemo(
    () => Array.from(new Set(exerciseGuides.flatMap((guide) => guide.equipment))).sort(),
    []
  );
  const difficultyOptions = useMemo(
    () => Array.from(new Set(exerciseGuides.map((guide) => guide.difficulty))).sort(),
    []
  );
  const locationOptions = useMemo(
    () => Array.from(new Set(exerciseGuides.map((guide) => guide.location))).sort(),
    []
  );

  const filteredGuides = useMemo(
    () =>
      exerciseGuides.filter((guide) => {
        const matchesLocation = locationFilter === "all" || guide.location === locationFilter || guide.location === "both";
        const matchesDifficulty = difficultyFilter === "all" || guide.difficulty === difficultyFilter;
        const matchesEquipment = equipmentFilter === "all" || guide.equipment.includes(equipmentFilter);
        return matchesLocation && matchesDifficulty && matchesEquipment;
      }),
    [difficultyFilter, equipmentFilter, locationFilter]
  );

  const selectedGuide =
    filteredGuides.find((guide) => guide.id === requestedGuide?.id) ?? filteredGuides[0] ?? null;
  const selectedCoachPath = selectedGuide ? liveCoachPath(selectedGuide) : null;
  const selectedGuideSections = selectedGuide
    ? [
        selectedGuide.setupSteps.length,
        selectedGuide.movementSteps.length,
        selectedGuide.commonMistakes.length,
        selectedGuide.safetyCues.length,
        selectedGuide.cameraGuidance.length
      ].reduce((total, count) => total + count, 0)
    : 0;

  const translateLocation = (loc: string) => {
    if (loc === "home") return t("home", "বাসা");
    if (loc === "gym") return t("gym", "জিম");
    if (loc === "both") return t("both", "উভয়");
    return loc;
  };

  const translateDifficulty = (diff: string) => {
    if (diff === "beginner") return t("beginner", "শিক্ষানবিস");
    if (diff === "returning") return t("returning", "পুনর্বার শুরুকারী");
    if (diff === "intermediate") return t("intermediate", "মধ্যবর্তী");
    return diff;
  };

  const translateEquipment = (equip: string) => {
    const equipMap: Record<string, string> = {
      "body weight": "বডিওয়েট",
      "exercise mat": "ব্যায়াম ম্যাট",
      "dumbbell": "ডাম্বেল",
      "cable": "ক্যাবল",
      "leverage machine": "লিভারেজ মেশিন",
      "barbell": "বারবেল",
      "sled machine": "স্লেড মেশিন",
      "ez barbell": "ইজি বারবেল"
    };
    return t(equip, equipMap[equip] || equip);
  };

  const translateStepText = (step: string) => {
    const stepMap: Record<string, string> = {
      // Squat
      "Stand with feet around shoulder width.": "কাঁধের সমান চওড়া করে পা রেখে দাঁড়ান।",
      "Turn side-on to the camera and keep your full body visible.": "ক্যামেরার দিকে পাশ ফিরে দাঁড়ান এবং আপনার পুরো শরীর দৃশ্যমান রাখুন।",
      "Send the hips back and bend the knees.": "কোমর পেছনে নিন এবং হাঁটু বাঁকান।",
      "Reach a comfortable depth, then stand tall with control.": "আরামদায়ক গভীরতা পর্যন্ত নামুন, তারপর নিয়ন্ত্রণের সাথে সোজা হয়ে দাঁড়ান।",
      "Heels lifting": "গোড়ালি ওপরে উঠে যাওয়া",
      "Rushing the bottom position": "নিচের অবস্থানে তাড়াহুড়ো করা",
      "Leaving the calibrated camera area": "ক্যালিব্রেট করা ক্যামেরা এলাকার বাইরে চলে যাওয়া",
      "Use a pain-free range.": "ব্যথামুক্ত মুভমেন্ট রেঞ্জ ব্যবহার করুন।",
      "Stop if you feel sharp knee, hip, or back pain.": "হাঁটু, কোমর বা পিঠে তীব্র ব্যথা অনুভব করলে অবিলম্বে বন্ধ করুন।",
      "Use a side view.": "পার্শ্ব দৃশ্য (সাইড ভিউ) ব্যবহার করুন।",
      "Place the device far enough away to show shoulders through ankles.": "কাঁধ থেকে গোড়ালি পর্যন্ত দেখানোর জন্য ডিভাইসটি যথেষ্ট দূরে রাখুন।",

      // Push-up
      "Place hands slightly wider than shoulder width.": "হাত দুটি কাঁধের চেয়ে সামান্য চওড়া করে রাখুন।",
      "Form a straight line from shoulders through hips to ankles.": "কাঁধ থেকে কোমর ও গোড়ালি পর্যন্ত একটি সোজা লাইন তৈরি করুন।",
      "Bend the elbows and lower with control.": "কনুই বাঁকান এবং নিয়ন্ত্রণের সাথে শরীর নিচে নামান।",
      "Reach a comfortable depth, then press back to a straight top plank.": "আরামদায়ক গভীরতা পর্যন্ত নামুন, তারপর চাপ দিয়ে সোজা টপ প্ল্যাঙ্ক অবস্থানে ফিরে যান।",
      "Hips sagging": "কোমর ঝুলে যাওয়া",
      "Hips piked too high": "কোমর খুব বেশি ওপরে উঠে যাওয়া",
      "Shoulders not stacked over wrists": "কাঁধ কব্জির ওপর ঠিকভাবে না থাকা",
      "Shallow repetitions": "অগভীর রিপিটেশন করা",
      "Use a pain-free shoulder and wrist range.": "ব্যথামুক্ত কাঁধ এবং কব্জির রেঞ্জ ব্যবহার করুন।",
      "Stop if you feel sharp pain or cannot maintain control.": "তীব্র ব্যথা অনুভব করলে বা নিয়ন্ত্রণ বজায় রাখতে না পারলে বন্ধ করুন।",
      "Use a clear side view.": "একটি পরিষ্কার পার্শ্ব দৃশ্য ব্যবহার করুন।",
      "Keep shoulder, elbow, wrist, hip, and ankle visible.": "কাঁধ, কনুই, কব্জি, কোমর এবং গোড়ালি দৃশ্যমান রাখুন।",

      // Lunge
      "Stand tall with clear space in front of you.": "সামনে ফাঁকা জায়গা রেখে সোজা হয়ে দাঁড়ান।",
      "Step forward and lower under control.": "সামনে পা বাড়ান এবং নিয়ন্ত্রণের সাথে নিচে নামুন।",
      "Push through the front foot to return.": "ফিরে আসার জন্য সামনের পায়ে ভর দিয়ে ধাক্কা দিন।",
      "Narrow stance": "খুব সংকীর্ণ স্ট্যান্স",
      "Uncontrolled front knee": "অনিয়ন্ত্রিত সামনের হাঁটু",
      "Rushing the return": "ফিরে আসার সময় তাড়াহুড়ো করা",
      "Use support if balance is uncertain.": "ভারসাম্য বজায় রাখতে সন্দেহ হলে সমর্থন ব্যবহার করুন।",
      "Stop if the movement causes pain.": "মুভমেন্টে ব্যথা হলে অবিলম্বে বন্ধ করুন।",
      "Use a side view and keep both feet plus the full body visible.": "পার্শ্ব দৃশ্য ব্যবহার করুন এবং উভয় পা ও পুরো শরীর দৃশ্যমান রাখুন।"
    };
    return t(step, stepMap[step] || step);
  };

  return (
    <section className="exercise-library">
      <header className="feature-header">
        <StatusPill tone="neutral">{t("Contributor module", "অবদানকারী মডিউল")}</StatusPill>
        <h1>{t("Exercise library", "ব্যায়াম লাইব্রেরি")}</h1>
        <p>{t("Bilingual setup, movement, safety, and camera guidance for supported exercises.", "সমর্থিত ব্যায়ামগুলোর জন্য দ্বিপাক্ষিক সেটআপ, মুভমেন্ট, নিরাপত্তা এবং ক্যামেরা নির্দেশিকা।")}</p>
      </header>

      <div className="exercise-library__controls" aria-label="Exercise filters">
        <label>
          <MapPin size={18} aria-hidden="true" />
          <span>{t("Location", "স্থান")}</span>
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
            <option value="all">{t("All locations", "সব স্থান")}</option>
            {locationOptions.map((location) => (
              <option key={location} value={location}>{translateLocation(location)}</option>
            ))}
          </select>
        </label>
        <label>
          <Filter size={18} aria-hidden="true" />
          <span>{t("Difficulty", "অসুবিধা স্তর")}</span>
          <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}>
            <option value="all">{t("All levels", "সব স্তর")}</option>
            {difficultyOptions.map((difficulty) => (
              <option key={difficulty} value={difficulty}>{translateDifficulty(difficulty)}</option>
            ))}
          </select>
        </label>
        <label>
          <Dumbbell size={18} aria-hidden="true" />
          <span>{t("Equipment", "সরঞ্জাম")}</span>
          <select value={equipmentFilter} onChange={(event) => setEquipmentFilter(event.target.value)}>
            <option value="all">{t("All equipment", "সব সরঞ্জাম")}</option>
            {equipmentOptions.map((equipment) => (
              <option key={equipment} value={equipment}>{translateEquipment(equipment)}</option>
            ))}
          </select>
        </label>
      </div>

      {filteredGuides.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={34} aria-hidden="true" />
          <h2>{t("No exercises match those filters", "কোনো ব্যায়াম ফিল্টারের সাথে মেলেনি")}</h2>
          <p>{t("Try another difficulty or equipment option.", "অন্য কোনো অসুবিধা স্তর বা সরঞ্জাম চেষ্টা করুন।")}</p>
        </div>
      ) : (
        <div className="exercise-library__workspace">
          <div className="exercise-guide-list" aria-label="Exercise guides">
            {filteredGuides.map((guide) => (
              <button
                className={selectedGuide?.id === guide.id ? "exercise-guide-list__item is-active" : "exercise-guide-list__item"}
                key={guide.id}
                type="button"
                onClick={() => {
                  setSearchParams({ guide: guide.id }, { replace: true });
                }}
              >
                <span>
                  <strong>{guide.nameEn}</strong>
                  <small>{guide.nameBn}</small>
                </span>
                <StatusPill tone={guide.liveCoachExercise ? "success" : "neutral"}>
                  {guide.liveCoachExercise ? t("Live coach", "লাইভ কোচ") : translateLocation(guide.location)}
                </StatusPill>
              </button>
            ))}
          </div>

          {selectedGuide && (
            <article className="exercise-guide-card" key={selectedGuide.id}>
              <div className="exercise-guide-card__heading">
                <BookOpen size={24} aria-hidden="true" />
                <div>
                  <h2>{selectedGuide.nameEn}</h2>
                  <p>{selectedGuide.nameBn}</p>
                </div>
                <StatusPill tone={selectedGuide.liveCoachExercise ? "success" : "neutral"}>
                  {selectedGuide.liveCoachExercise ? t("Live coach", "লাইভ কোচ") : t("Guide only", "শুধু গাইড")}
                </StatusPill>
              </div>
              <div className="exercise-guide-card__meta">
                <span>{translateDifficulty(selectedGuide.difficulty)}</span>
                <span>{translateLocation(selectedGuide.location)}</span>
                {selectedGuide.equipment.map((equipment) => <span key={equipment}>{translateEquipment(equipment)}</span>)}
              </div>
              {selectedGuide.gifUrl && (
                <div className="exercise-guide-card__media">
                  <img
                    src={`${exerciseAssetBaseUrl}${selectedGuide.gifUrl}`}
                    alt={`${selectedGuide.nameEn} demonstration`}
                    loading="lazy"
                  />
                </div>
              )}
              <div className="exercise-guide-card__content">
                <GuideSection title={selectedGuide.movementSteps.length === 0 ? t("Instructions", "নির্দেশনা") : t("Setup", "সেটআপ")} items={selectedGuide.setupSteps} translateStep={translateStepText} />
                <GuideSection title={t("Movement", "মুভমেন্ট")} items={selectedGuide.movementSteps} translateStep={translateStepText} />
                <GuideSection title={t("Common mistakes", "সাধারণ ভুলসমূহ")} items={selectedGuide.commonMistakes} translateStep={translateStepText} />
                <GuideSection title={t("Safety", "নিরাপত্তা")} items={selectedGuide.safetyCues} translateStep={translateStepText} />
                <GuideSection title={t("Camera", "ক্যামেরা")} items={selectedGuide.cameraGuidance} translateStep={translateStepText} />
                {selectedGuideSections === 0 && (
                  <section>
                    <h3>{t("Guide details", "গাইড বিবরণ")}</h3>
                    <p>{t("Detailed coaching notes are not available for this exercise yet.", "এই ব্যায়ামের জন্য বিস্তারিত কোনো কোচিং নোট এখনও উপলব্ধ নেই।")}</p>
                  </section>
                )}
              </div>
              {selectedCoachPath && (
                <Link className="exercise-guide-card__action" to={selectedCoachPath}>
                  <Video size={18} />
                  {t("Practice with live coach", "লাইভ কোচের সাথে অনুশীলন করুন")}
                  <ArrowRight size={18} />
                </Link>
              )}
            </article>
          )}
        </div>
      )}
    </section>
  );
}
