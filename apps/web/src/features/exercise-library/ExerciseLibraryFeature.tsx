import { ArrowRight, BookOpen, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusPill } from "../../components/ui/StatusPill";
import { exerciseGuides } from "./exerciseGuides";

export function ExerciseLibraryFeature() {
  return (
    <section className="exercise-library">
      <header className="feature-header">
        <StatusPill tone="neutral">Contributor module</StatusPill>
        <h1>Exercise library</h1>
        <p>Bilingual setup, movement, safety, and camera guidance for supported exercises.</p>
      </header>
      <div className="exercise-guide-grid">
        {exerciseGuides.map((guide) => (
          <article className="exercise-guide-card" key={guide.id}>
            <div className="exercise-guide-card__heading">
              <BookOpen size={24} aria-hidden="true" />
              <div>
                <h2>{guide.nameEn}</h2>
                <p>{guide.nameBn}</p>
              </div>
              <StatusPill tone={guide.liveCoaching ? "success" : "neutral"}>
                {guide.liveCoaching ? "Live coach" : "Coming later"}
              </StatusPill>
            </div>
            <div className="exercise-guide-card__content">
              <section>
                <h3>Setup</h3>
                <ul>{guide.setupSteps.map((step) => <li key={step}>{step}</li>)}</ul>
              </section>
              <section>
                <h3>Movement</h3>
                <ul>{guide.movementSteps.map((step) => <li key={step}>{step}</li>)}</ul>
              </section>
              <section>
                <h3>Safety and camera</h3>
                <ul>{[...guide.safetyCues, ...guide.cameraGuidance].map((step) => <li key={step}>{step}</li>)}</ul>
              </section>
            </div>
            {guide.liveCoaching && (
              <Link className="exercise-guide-card__action" to={`/coach?exercise=${encodeURIComponent(guide.id)}`}>
                <Video size={18} />
                Open live coach
                <ArrowRight size={18} />
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
