import type {
  EquipmentOption,
  FitnessLevel,
  LanguagePreference,
  ProfileInput
} from "@shorir/contracts";
import { Check, Dumbbell, HeartPulse, Loader2, ShieldAlert, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { normalizeLanguage, useAppLanguage } from "../../app/language";
import { useAppServices } from "../../app/providers";
import { ensureProfileId } from "../../app/profileSession";
import { StatusPill } from "../../components/ui/StatusPill";

const equipmentOptions: Array<{ value: EquipmentOption; label: string; labelBn: string }> = [
  { value: "none", label: "No equipment", labelBn: "সরঞ্জাম নেই" },
  { value: "mat", label: "Exercise mat", labelBn: "এক্সারসাইজ ম্যাট" },
  { value: "dumbbells", label: "Dumbbells", labelBn: "ডাম্বেল" },
  { value: "gym", label: "Gym access", labelBn: "জিম সুবিধা" }
];

const scheduleOptions = [
  { value: "Saturday", label: "Sat", labelBn: "শনি" },
  { value: "Sunday", label: "Sun", labelBn: "রবি" },
  { value: "Monday", label: "Mon", labelBn: "সোম" },
  { value: "Tuesday", label: "Tue", labelBn: "মঙ্গল" },
  { value: "Wednesday", label: "Wed", labelBn: "বুধ" },
  { value: "Thursday", label: "Thu", labelBn: "বৃহঃ" },
  { value: "Friday", label: "Fri", labelBn: "শুক্র" }
];

const initialForm: ProfileInput = {
  displayName: "",
  language: "en",
  goal: "Build a consistent exercise habit",
  fitnessLevel: "beginner",
  equipment: ["none"],
  weeklySchedule: [],
  safety: { hasPain: false, painAreas: [], notes: "" }
};

export function OnboardingFeature() {
  const { apiClient } = useAppServices();
  const { language, setLanguage, t } = useAppLanguage();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileInput>(() => ({ ...initialForm, language }));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<"basics" | "body" | "training" | "safety">("basics");

  useEffect(() => {
    let active = true;
    void ensureProfileId(apiClient)
      .then(async (id) => {
        const profile = await apiClient.getProfile(id);
        if (!active) return;
        setProfileId(id);
        if (profile) {
          const profileLanguage = normalizeLanguage(profile.language);
          setLanguage(profileLanguage);
          setForm({
            displayName: profile.displayName ?? "",
            language: profileLanguage,
            goal: profile.goal,
            fitnessLevel: profile.fitnessLevel,
            equipment: profile.equipment,
            weeklySchedule: profile.weeklySchedule,
            safety: profile.safety,
            height: profile.height,
            weight: profile.weight,
            targetWeight: profile.targetWeight,
            age: profile.age,
            gender: profile.gender
          });
        }
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load your profile.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiClient]);

  function toggleEquipment(option: EquipmentOption) {
    setSaved(false);
    setForm((current) => {
      const selected = current.equipment.includes(option);
      let equipment = selected
        ? current.equipment.filter((item) => item !== option)
        : [...current.equipment.filter((item) => item !== "none"), option];
      if (option === "none" && !selected) equipment = ["none"];
      if (equipment.length === 0) equipment = ["none"];
      return { ...current, equipment };
    });
  }

  function toggleSchedule(day: string) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      weeklySchedule: current.weeklySchedule.includes(day)
        ? current.weeklySchedule.filter((item) => item !== day)
        : [...current.weeklySchedule, day]
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!profileId) return;
    setIsSaving(true);
    setError(null);
    try {
      const displayName = form.displayName?.trim();
      const notes = form.safety.notes?.trim();
      await apiClient.saveProfile({
        id: profileId,
        ...(displayName ? { displayName } : {}),
        language: form.language,
        goal: form.goal.trim(),
        fitnessLevel: form.fitnessLevel,
        equipment: form.equipment,
        weeklySchedule: form.weeklySchedule,
        safety: {
          hasPain: form.safety.hasPain,
          painAreas: form.safety.painAreas.map((area) => area.trim()).filter(Boolean),
          ...(notes ? { notes } : {})
        },
        ...(form.height !== undefined ? { height: form.height } : {}),
        ...(form.weight !== undefined ? { weight: form.weight } : {}),
        ...(form.targetWeight !== undefined ? { targetWeight: form.targetWeight } : {}),
        ...(form.age !== undefined ? { age: form.age } : {}),
        ...(form.gender !== undefined ? { gender: form.gender } : {})
      });
      setSaved(true);
      setLanguage(normalizeLanguage(form.language));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <section className="panel loading-state"><Loader2 className="spin" /> {t("Loading profile...", "প্রোফাইল লোড হচ্ছে...")}</section>;
  }

  const steps = [
    {
      id: "basics" as const,
      icon: UserRound,
      label: t("Basics", "বেসিক"),
      summary: form.displayName || t("Name, language, goal", "নাম, ভাষা, লক্ষ্য")
    },
    {
      id: "body" as const,
      icon: HeartPulse,
      label: t("Body", "বডি"),
      summary: form.weight ? `${form.weight} kg` : t("Optional metrics", "ঐচ্ছিক মেট্রিক")
    },
    {
      id: "training" as const,
      icon: Dumbbell,
      label: t("Training", "ট্রেনিং"),
      summary: `${form.fitnessLevel} / ${form.weeklySchedule.length || 0} ${t("days", "দিন")}`
    },
    {
      id: "safety" as const,
      icon: ShieldAlert,
      label: t("Safety", "সেফটি"),
      summary: form.safety.hasPain ? t("Pain noted", "ব্যথা উল্লেখ আছে") : t("No pain noted", "ব্যথা নেই")
    }
  ];

  return (
    <section className="onboarding">
      <header className="feature-header onboarding-hero">
        <StatusPill tone={saved ? "success" : "neutral"}>{saved ? "Profile saved" : "Personal setup"}</StatusPill>
        <h1>{t("Set up your coaching profile", "আপনার কোচিং প্রোফাইল সেট করুন")}</h1>
        <p>{t("Choose one language, add only what matters, and SHORIR AI will tailor coaching, meals, and safety guidance.", "একটি ভাষা বেছে নিন, প্রয়োজনীয় তথ্য দিন, তারপর SHORIR AI কোচিং, খাবার ও সেফটি গাইড সাজিয়ে দেবে।")}</p>
      </header>

      <form className="onboarding-form" onSubmit={submit}>
        <nav className="onboarding-steps" aria-label={t("Profile setup steps", "প্রোফাইল সেটআপ ধাপ")}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                className={activeStep === step.id ? "is-active" : ""}
                onClick={() => setActiveStep(step.id)}
              >
                <span>{index + 1}</span>
                <Icon size={18} aria-hidden="true" />
                <strong>{step.label}</strong>
                <small>{step.summary}</small>
              </button>
            );
          })}
        </nav>

        <div className="onboarding-panel">
          {activeStep === "basics" && (
            <section className="form-section onboarding-layer">
              <h2>{t("Basics", "বেসিক")}</h2>
              <p>{t("Start with identity, language, and your main goal.", "নাম, ভাষা ও মূল লক্ষ্য দিয়ে শুরু করুন।")}</p>
              <div className="form-grid">
                <label>
                  {t("Display name", "নাম")}
                  <input
                    value={form.displayName ?? ""}
                    onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                    placeholder={t("Optional", "ঐচ্ছিক")}
                  />
                </label>
                <label>
                  {t("Coaching language", "কোচিং ভাষা")}
                  <select
                    value={normalizeLanguage(form.language)}
                    onChange={(event) => {
                      const nextLanguage = event.target.value as Exclude<LanguagePreference, "mixed">;
                      setForm({ ...form, language: nextLanguage });
                      setLanguage(nextLanguage);
                    }}
                  >
                    <option value="en">English</option>
                    <option value="bn">বাংলা</option>
                  </select>
                </label>
                <label className="form-grid__wide">
                  {t("Main goal", "মূল লক্ষ্য")}
                  <input
                    required
                    value={form.goal}
                    onChange={(event) => setForm({ ...form, goal: event.target.value })}
                  />
                </label>
              </div>
            </section>
          )}

          {activeStep === "body" && (
            <section className="form-section onboarding-layer">
              <h2>{t("Body metrics", "বডি মেট্রিক")}</h2>
              <p>{t("These are optional, but improve calorie and progress estimates.", "এগুলো ঐচ্ছিক, তবে ক্যালরি ও প্রগ্রেস অনুমান উন্নত করে।")}</p>
              <div className="form-grid">
                <label>
                  {t("Age", "বয়স")}
                  <input
                    min="1"
                    step="1"
                    type="number"
                    value={form.age ?? ""}
                    onChange={(event) =>
                      setForm({ ...form, age: event.target.value === "" ? undefined : Number(event.target.value) })
                    }
                    placeholder={t("Optional", "ঐচ্ছিক")}
                  />
                </label>
                <label>
                  {t("Gender", "লিঙ্গ")}
                  <select
                    value={form.gender ?? ""}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        gender: event.target.value === "" ? undefined : (event.target.value as "male" | "female" | "other")
                      })
                    }
                  >
                    <option value="">{t("Prefer not to say", "বলতে চাই না")}</option>
                    <option value="male">{t("Male", "পুরুষ")}</option>
                    <option value="female">{t("Female", "নারী")}</option>
                    <option value="other">{t("Other", "অন্যান্য")}</option>
                  </select>
                </label>
                <label>
                  {t("Height (cm)", "উচ্চতা (সেমি)")}
                  <input
                    min="1"
                    step="0.1"
                    type="number"
                    value={form.height ?? ""}
                    onChange={(event) =>
                      setForm({ ...form, height: event.target.value === "" ? undefined : Number(event.target.value) })
                    }
                    placeholder={t("Optional", "ঐচ্ছিক")}
                  />
                </label>
                <label>
                  {t("Current weight (kg)", "বর্তমান ওজন (কেজি)")}
                  <input
                    min="1"
                    step="0.1"
                    type="number"
                    value={form.weight ?? ""}
                    onChange={(event) =>
                      setForm({ ...form, weight: event.target.value === "" ? undefined : Number(event.target.value) })
                    }
                    placeholder={t("Optional", "ঐচ্ছিক")}
                  />
                </label>
                <label>
                  {t("Target weight (kg)", "লক্ষ্য ওজন (কেজি)")}
                  <input
                    min="1"
                    step="0.1"
                    type="number"
                    value={form.targetWeight ?? ""}
                    onChange={(event) =>
                      setForm({ ...form, targetWeight: event.target.value === "" ? undefined : Number(event.target.value) })
                    }
                    placeholder={t("Optional", "ঐচ্ছিক")}
                  />
                </label>
              </div>
            </section>
          )}

          {activeStep === "training" && (
            <section className="form-section onboarding-layer">
              <h2>{t("Training setup", "ট্রেনিং সেটআপ")}</h2>
              <p>{t("Pick your level, equipment, and realistic training days.", "আপনার লেভেল, সরঞ্জাম ও বাস্তবসম্মত ট্রেনিং দিন বেছে নিন।")}</p>
              <div className="form-grid">
                <label>
                  {t("Fitness level", "ফিটনেস লেভেল")}
                  <select
                    value={form.fitnessLevel}
                    onChange={(event) => setForm({ ...form, fitnessLevel: event.target.value as FitnessLevel })}
                  >
                    <option value="beginner">{t("Beginner", "নতুন")}</option>
                    <option value="returning">{t("Returning", "ফিরছেন")}</option>
                    <option value="intermediate">{t("Intermediate", "মাঝারি")}</option>
                  </select>
                </label>
              </div>
              <h3>{t("Equipment", "সরঞ্জাম")}</h3>
              <div className="choice-grid">
                {equipmentOptions.map((option) => (
                  <label className="choice-control" key={option.value}>
                    <input
                      type="checkbox"
                      checked={form.equipment.includes(option.value)}
                      onChange={() => toggleEquipment(option.value)}
                    />
                    <span>{t(option.label, option.labelBn)}</span>
                  </label>
                ))}
              </div>
              <h3>{t("Weekly schedule", "সাপ্তাহিক সময়সূচি")}</h3>
              <div className="choice-grid choice-grid--days">
                {scheduleOptions.map((day) => (
                  <label className="choice-control" key={day.value}>
                    <input
                      type="checkbox"
                      checked={form.weeklySchedule.includes(day.value)}
                      onChange={() => toggleSchedule(day.value)}
                    />
                    <span>{t(day.label, day.labelBn)}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {activeStep === "safety" && (
            <section className="form-section onboarding-layer">
              <div className="safety-heading">
                <ShieldAlert size={20} />
                <div>
                  <h2>{t("Safety check", "সেফটি চেক")}</h2>
                  <p>{t("SHORIR AI is not a medical service. Stop if movement causes pain.", "SHORIR AI কোনো মেডিকেল সার্ভিস নয়। ব্যথা হলে ব্যায়াম বন্ধ করুন।")}</p>
                </div>
              </div>
              <label className="choice-control choice-control--inline">
                <input
                  type="checkbox"
                  checked={form.safety.hasPain}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      safety: { ...form.safety, hasPain: event.target.checked }
                    })
                  }
                />
                <span>{t("I currently have pain or a movement limitation", "আমার বর্তমানে ব্যথা বা মুভমেন্ট সীমাবদ্ধতা আছে")}</span>
              </label>
              {form.safety.hasPain && (
                <div className="form-grid">
                  <label>
                    {t("Pain areas", "ব্যথার জায়গা")}
                    <input
                      value={form.safety.painAreas.join(", ")}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          safety: { ...form.safety, painAreas: event.target.value.split(",") }
                        })
                      }
                      placeholder={t("Example: left knee, lower back", "যেমন: বাম হাঁটু, কোমর")}
                    />
                  </label>
                  <label>
                    {t("Notes", "নোট")}
                    <textarea
                      value={form.safety.notes ?? ""}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          safety: { ...form.safety, notes: event.target.value }
                        })
                      }
                      placeholder={t("Optional context", "ঐচ্ছিক তথ্য")}
                    />
                  </label>
                </div>
              )}
            </section>
          )}

          <div className="onboarding-actions">
            <button
              type="button"
              onClick={() => {
                const currentIndex = steps.findIndex((step) => step.id === activeStep);
                setActiveStep(steps[Math.max(0, currentIndex - 1)]!.id);
              }}
              disabled={activeStep === steps[0]!.id}
            >
              {t("Back", "পেছনে")}
            </button>
            <button
              type="button"
              onClick={() => {
                const currentIndex = steps.findIndex((step) => step.id === activeStep);
                setActiveStep(steps[Math.min(steps.length - 1, currentIndex + 1)]!.id);
              }}
              disabled={activeStep === steps[steps.length - 1]!.id}
            >
              {t("Next", "পরবর্তী")}
            </button>
            <button className="primary-action" type="submit" disabled={isSaving || !profileId}>
              {isSaving ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
              {t("Save profile", "প্রোফাইল সেভ করুন")}
            </button>
          </div>
        </div>

        {error && <p className="inline-error">{error}</p>}
      </form>
    </section>
  );
}
