import { BookOpen } from "lucide-react";
import { StatusPill } from "../../components/ui/StatusPill";

export function ExerciseLibraryFeature() {
  return (
    <section className="exercise-library">
      <header className="feature-header">
        <StatusPill tone="neutral">Contributor module</StatusPill>
        <h1>Exercise library</h1>
        <p>Bilingual setup, movement, safety, and camera guidance for supported exercises.</p>
      </header>
      <div className="empty-state">
        <BookOpen size={34} aria-hidden="true" />
        <h2>Exercise guides are being prepared</h2>
        <p>This independent module is assigned to the exercise-library contributor.</p>
      </div>
    </section>
  );
}
