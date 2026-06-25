import { ArrowRight, BookOpen, Dumbbell, Filter, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatusPill } from "../../components/ui/StatusPill";
import { type ExerciseGuide, exerciseGuides } from "./exerciseGuides";

type DifficultyFilter = ExerciseGuide["difficulty"] | "all";
type EquipmentFilter = string | "all";

function GuideSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3>{title}</h3>
      <ul>{items.map((step) => <li key={step}>{step}</li>)}</ul>
    </section>
  );
}

export function ExerciseLibraryFeature() {
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>("all");
  const [selectedGuideId, setSelectedGuideId] = useState<ExerciseGuide["id"]>(exerciseGuides[0]?.id ?? "squat");

  const equipmentOptions = useMemo(
    () => Array.from(new Set(exerciseGuides.flatMap((guide) => guide.equipment))).sort(),
    []
  );

  const filteredGuides = useMemo(
    () =>
      exerciseGuides.filter((guide) => {
        const matchesDifficulty = difficultyFilter === "all" || guide.difficulty === difficultyFilter;
        const matchesEquipment = equipmentFilter === "all" || guide.equipment.includes(equipmentFilter);
        return matchesDifficulty && matchesEquipment;
      }),
    [difficultyFilter, equipmentFilter]
  );

  const selectedGuide =
    filteredGuides.find((guide) => guide.id === selectedGuideId) ?? filteredGuides[0] ?? null;

  return (
    <section className="exercise-library">
      <header className="feature-header">
        <StatusPill tone="neutral">Contributor module</StatusPill>
        <h1>Exercise library</h1>
        <p>Bilingual setup, movement, safety, and camera guidance for supported exercises.</p>
      </header>

      <div className="exercise-library__controls" aria-label="Exercise filters">
        <label>
          <Filter size={18} aria-hidden="true" />
          <span>Difficulty</span>
          <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}>
            <option value="all">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="returning">Returning</option>
            <option value="intermediate">Intermediate</option>
          </select>
        </label>
        <label>
          <Dumbbell size={18} aria-hidden="true" />
          <span>Equipment</span>
          <select value={equipmentFilter} onChange={(event) => setEquipmentFilter(event.target.value)}>
            <option value="all">All equipment</option>
            {equipmentOptions.map((equipment) => (
              <option key={equipment} value={equipment}>{equipment}</option>
            ))}
          </select>
        </label>
      </div>

      {filteredGuides.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={34} aria-hidden="true" />
          <h2>No exercises match those filters</h2>
          <p>Try another difficulty or equipment option.</p>
        </div>
      ) : (
        <div className="exercise-library__workspace">
          <div className="exercise-guide-list" aria-label="Exercise guides">
            {filteredGuides.map((guide) => (
              <button
                className={selectedGuide?.id === guide.id ? "exercise-guide-list__item is-active" : "exercise-guide-list__item"}
                key={guide.id}
                type="button"
                onClick={() => setSelectedGuideId(guide.id)}
              >
                <span>
                  <strong>{guide.nameEn}</strong>
                  <small>{guide.nameBn}</small>
                </span>
                <StatusPill tone={guide.liveCoaching ? "success" : "neutral"}>
                  {guide.liveCoaching ? "Live coach" : "Guide only"}
                </StatusPill>
              </button>
            ))}
          </div>

          {selectedGuide && (
            <article className="exercise-guide-card">
              <div className="exercise-guide-card__heading">
                <BookOpen size={24} aria-hidden="true" />
                <div>
                  <h2>{selectedGuide.nameEn}</h2>
                  <p>{selectedGuide.nameBn}</p>
                </div>
                <StatusPill tone={selectedGuide.liveCoaching ? "success" : "neutral"}>
                  {selectedGuide.liveCoaching ? "Live coach" : "Coming later"}
                </StatusPill>
              </div>
              <div className="exercise-guide-card__meta">
                <span>{selectedGuide.difficulty}</span>
                {selectedGuide.equipment.map((equipment) => <span key={equipment}>{equipment}</span>)}
              </div>
              <div className="exercise-guide-card__content">
                <GuideSection title="Setup" items={selectedGuide.setupSteps} />
                <GuideSection title="Movement" items={selectedGuide.movementSteps} />
                <GuideSection title="Common mistakes" items={selectedGuide.commonMistakes} />
                <GuideSection title="Safety" items={selectedGuide.safetyCues} />
                <GuideSection title="Camera" items={selectedGuide.cameraGuidance} />
              </div>
              {selectedGuide.liveCoaching && (
                <Link className="exercise-guide-card__action" to={`/coach?exercise=${encodeURIComponent(selectedGuide.id)}`}>
                  <Video size={18} />
                  Open live coach
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
