import { ArrowRight, BookOpen, Dumbbell, Filter, MapPin, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StatusPill } from "../../components/ui/StatusPill";
import { exerciseGuideById, exerciseGuides, liveCoachPath } from "./exerciseGuides";

type DifficultyFilter = string | "all";
type EquipmentFilter = string | "all";
type LocationFilter = string | "all";

const exerciseAssetBaseUrl = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/master/";

function GuideSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3>{title}</h3>
      <ul>{items.map((step) => <li key={step}>{step}</li>)}</ul>
    </section>
  );
}

export function ExerciseLibraryFeature() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>("all");
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

  return (
    <section className="exercise-library">
      <header className="feature-header">
        <StatusPill tone="neutral">Contributor module</StatusPill>
        <h1>Exercise library</h1>
        <p>Bilingual setup, movement, safety, and camera guidance for supported exercises.</p>
      </header>

      <div className="exercise-library__controls" aria-label="Exercise filters">
        <label>
          <MapPin size={18} aria-hidden="true" />
          <span>Location</span>
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
            <option value="all">All locations</option>
            {locationOptions.map((location) => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </label>
        <label>
          <Filter size={18} aria-hidden="true" />
          <span>Difficulty</span>
          <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}>
            <option value="all">All levels</option>
            {difficultyOptions.map((difficulty) => (
              <option key={difficulty} value={difficulty}>{difficulty}</option>
            ))}
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
                onClick={() => {
                  setSearchParams({ guide: guide.id }, { replace: true });
                }}
              >
                <span>
                  <strong>{guide.nameEn}</strong>
                  <small>{guide.nameBn}</small>
                </span>
                <StatusPill tone={guide.liveCoachExercise ? "success" : "neutral"}>
                  {guide.liveCoachExercise ? "Live coach" : guide.location}
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
                <StatusPill tone={selectedGuide.liveCoachExercise ? "success" : "neutral"}>
                  {selectedGuide.liveCoachExercise ? "Live coach" : "Guide only"}
                </StatusPill>
              </div>
              <div className="exercise-guide-card__meta">
                <span>{selectedGuide.difficulty}</span>
                <span>{selectedGuide.location}</span>
                {selectedGuide.equipment.map((equipment) => <span key={equipment}>{equipment}</span>)}
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
                <GuideSection title={selectedGuide.movementSteps.length === 0 ? "Instructions" : "Setup"} items={selectedGuide.setupSteps} />
                <GuideSection title="Movement" items={selectedGuide.movementSteps} />
                <GuideSection title="Common mistakes" items={selectedGuide.commonMistakes} />
                <GuideSection title="Safety" items={selectedGuide.safetyCues} />
                <GuideSection title="Camera" items={selectedGuide.cameraGuidance} />
                {selectedGuideSections === 0 && (
                  <section>
                    <h3>Guide details</h3>
                    <p>Detailed coaching notes are not available for this exercise yet.</p>
                  </section>
                )}
              </div>
              {selectedCoachPath && (
                <Link className="exercise-guide-card__action" to={selectedCoachPath}>
                  <Video size={18} />
                  Practice with live coach
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
