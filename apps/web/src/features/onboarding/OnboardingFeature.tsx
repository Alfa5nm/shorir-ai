import type {
  EquipmentOption,
  FitnessLevel,
  LanguagePreference,
  ProfileInput
} from "@shorir/contracts";
import { Check, Loader2, ShieldAlert } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAppServices } from "../../app/providers";
import { ensureProfileId } from "../../app/profileSession";
import { StatusPill } from "../../components/ui/StatusPill";

const equipmentOptions: Array<{ value: EquipmentOption; label: string }> = [
  { value: "none", label: "No equipment" },
  { value: "mat", label: "Exercise mat" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "gym", label: "Gym access" }
];

const scheduleOptions = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const initialForm: ProfileInput = {
  displayName: "",
  language: "mixed",
  goal: "Build a consistent exercise habit",
  fitnessLevel: "beginner",
  equipment: ["none"],
  weeklySchedule: [],
  safety: { hasPain: false, painAreas: [], notes: "" }
};

export function OnboardingFeature() {
  const { apiClient } = useAppServices();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileInput>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void ensureProfileId(apiClient)
      .then(async (id) => {
        const profile = await apiClient.getProfile(id);
        if (!active) return;
        setProfileId(id);
        if (profile) {
          setForm({
            displayName: profile.displayName ?? "",
            language: profile.language,
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <section className="panel loading-state"><Loader2 className="spin" /> Loading profile...</section>;
  }

  return (
    <section className="onboarding">
      <header className="feature-header">
        <StatusPill tone={saved ? "success" : "neutral"}>{saved ? "Profile saved" : "Personal setup"}</StatusPill>
        <h1>Set up your coaching profile</h1>
        <p>These choices shape language, equipment, scheduling, and cautious safety guidance.</p>
      </header>

      <form className="onboarding-form" onSubmit={submit}>
        <section className="form-section">
          <h2>Basics</h2>
          <div className="form-grid">
            <label>
              Display name
              <input
                value={form.displayName ?? ""}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                placeholder="Optional"
              />
            </label>
            <label>
              Coaching language
              <select
                value={form.language}
                onChange={(event) =>
                  setForm({ ...form, language: event.target.value as LanguagePreference })
                }
              >
                <option value="mixed">Bangla + English</option>
                <option value="bn">Bangla</option>
                <option value="en">English</option>
              </select>
            </label>
            <label>
              Fitness level
              <select
                value={form.fitnessLevel}
                onChange={(event) => setForm({ ...form, fitnessLevel: event.target.value as FitnessLevel })}
              >
                <option value="beginner">Beginner</option>
                <option value="returning">Returning</option>
                <option value="intermediate">Intermediate</option>
              </select>
            </label>
            <label className="form-grid__wide">
              Main goal
              <input
                required
                value={form.goal}
                onChange={(event) => setForm({ ...form, goal: event.target.value })}
              />
            </label>
            <label>
              Age
              <input
                min="1"
                step="1"
                type="number"
                value={form.age ?? ""}
                onChange={(event) =>
                  setForm({ ...form, age: event.target.value === "" ? undefined : Number(event.target.value) })
                }
                placeholder="Optional"
              />
            </label>
            <label>
              Gender
              <select
                value={form.gender ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    gender: event.target.value === "" ? undefined : (event.target.value as "male" | "female" | "other")
                  })
                }
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Height (cm)
              <input
                min="1"
                step="0.1"
                type="number"
                value={form.height ?? ""}
                onChange={(event) =>
                  setForm({ ...form, height: event.target.value === "" ? undefined : Number(event.target.value) })
                }
                placeholder="Optional"
              />
            </label>
            <label>
              Current weight (kg)
              <input
                min="1"
                step="0.1"
                type="number"
                value={form.weight ?? ""}
                onChange={(event) =>
                  setForm({ ...form, weight: event.target.value === "" ? undefined : Number(event.target.value) })
                }
                placeholder="Optional"
              />
            </label>
            <label>
              Target weight (kg)
              <input
                min="1"
                step="0.1"
                type="number"
                value={form.targetWeight ?? ""}
                onChange={(event) =>
                  setForm({ ...form, targetWeight: event.target.value === "" ? undefined : Number(event.target.value) })
                }
                placeholder="Optional"
              />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2>Equipment</h2>
          <div className="choice-grid">
            {equipmentOptions.map((option) => (
              <label className="choice-control" key={option.value}>
                <input
                  type="checkbox"
                  checked={form.equipment.includes(option.value)}
                  onChange={() => toggleEquipment(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section">
          <h2>Weekly schedule</h2>
          <div className="choice-grid choice-grid--days">
            {scheduleOptions.map((day) => (
              <label className="choice-control" key={day}>
                <input
                  type="checkbox"
                  checked={form.weeklySchedule.includes(day)}
                  onChange={() => toggleSchedule(day)}
                />
                <span>{day.slice(0, 3)}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section">
          <div className="safety-heading">
            <ShieldAlert size={20} />
            <div>
              <h2>Safety check</h2>
              <p>SHORIR AI is not a medical service. Stop if movement causes pain.</p>
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
            <span>I currently have pain or a movement limitation</span>
          </label>
          {form.safety.hasPain && (
            <div className="form-grid">
              <label>
                Pain areas
                <input
                  value={form.safety.painAreas.join(", ")}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      safety: { ...form.safety, painAreas: event.target.value.split(",") }
                    })
                  }
                  placeholder="Example: left knee, lower back"
                />
              </label>
              <label>
                Notes
                <textarea
                  value={form.safety.notes ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      safety: { ...form.safety, notes: event.target.value }
                    })
                  }
                  placeholder="Optional context"
                />
              </label>
            </div>
          )}
        </section>

        {error && <p className="inline-error">{error}</p>}
        <button className="primary-action" type="submit" disabled={isSaving || !profileId}>
          {isSaving ? <Loader2 className="spin" size={18} /> : <Check size={18} />}
          Save profile
        </button>
      </form>
    </section>
  );
}
