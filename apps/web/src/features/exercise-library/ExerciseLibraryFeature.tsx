import { useState, useMemo } from "react";
import { BookOpen, RefreshCw, ShieldAlert, Video, X, Dumbbell, Play, ChevronRight, Activity, MapPin } from "lucide-react";
import { StatusPill } from "../../components/ui/StatusPill";
import { exerciseGuides, ExerciseGuide } from "./exerciseGuides";
import "./exercise-library.css";

type Language = "en" | "bn";

export function ExerciseLibraryFeature() {
  const [lang, setLang] = useState<Language>("bn");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Parse bilingual string "English | Bangla"
  const parseLang = (text: string): string => {
    const parts = text.split(" | ");
    if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
      return lang === "en" ? parts[0] : parts[1];
    }
    return text;
  };

  const getExerciseName = (ex: ExerciseGuide) => lang === "en" ? ex.nameEn : ex.nameBn;

  const filteredGuides = useMemo(() => {
    return exerciseGuides.filter((ex) => {
      // For a specific location filter (e.g. "home"), it should show exercises that are exclusively for that location OR "both"
      const matchLocation = locationFilter === "all" || (ex as any).location === "both" || (ex as any).location === locationFilter;
      const matchDifficulty = difficultyFilter === "all" || ex.difficulty === difficultyFilter;
      const matchEquipment = equipmentFilter === "all" || ex.equipment.includes(equipmentFilter);
      return matchLocation && matchDifficulty && matchEquipment;
    });
  }, [locationFilter, difficultyFilter, equipmentFilter]);

  const selectedExercise = useMemo(() => {
    return exerciseGuides.find(ex => ex.id === selectedExerciseId) || null;
  }, [selectedExerciseId]);

  // Unique equipments from the guides
  const availableEquipments = useMemo(() => {
    const eqSet = new Set<string>();
    exerciseGuides.forEach(ex => ex.equipment.forEach(eq => eqSet.add(eq)));
    return Array.from(eqSet).sort();
  }, []);

  return (
    <section className="exercise-library-container">
      <header className="feature-header">
        <StatusPill tone="neutral">{lang === "en" ? "Contributor module" : "কন্ট্রিবিউটর মডিউল"}</StatusPill>
        <h1>{lang === "en" ? "Exercise Library" : "ব্যায়াম লাইব্রেরি"}</h1>
        <p>{lang === "en" 
          ? "Bilingual setup, movement, safety, and camera guidance for supported exercises." 
          : "সমর্থিত ব্যায়ামের জন্য দ্বিভাষিক সেটআপ, মুভমেন্ট, নিরাপত্তা এবং ক্যামেরা নির্দেশিকা।"}</p>
      </header>

      <div className="exercise-library-controls">
        <div className="filters">
          <div className="filter-group">
            <MapPin size={18} color="rgba(255,248,234,0.7)" />
            <select 
              value={locationFilter} 
              onChange={e => setLocationFilter(e.target.value)}
              aria-label={lang === "en" ? "Location" : "স্থান"}
            >
              <option value="all">{lang === "en" ? "All Locations" : "সব স্থান"}</option>
              <option value="home">{lang === "en" ? "Home" : "বাড়ি"}</option>
              <option value="gym">{lang === "en" ? "Gym" : "জিম"}</option>
            </select>
          </div>
          <div className="filter-group">
            <Activity size={18} color="rgba(255,248,234,0.7)" />
            <select 
              value={difficultyFilter} 
              onChange={e => setDifficultyFilter(e.target.value)}
              aria-label={lang === "en" ? "Difficulty" : "কঠিনতা"}
            >
              <option value="all">{lang === "en" ? "All Difficulties" : "সব কঠিনতা"}</option>
              <option value="beginner">{lang === "en" ? "Beginner" : "শিক্ষানবিস"}</option>
              <option value="intermediate">{lang === "en" ? "Intermediate" : "মধ্যবর্তী"}</option>
            </select>
          </div>
          <div className="filter-group">
            <Dumbbell size={18} color="rgba(255,248,234,0.7)" />
            <select 
              value={equipmentFilter} 
              onChange={e => setEquipmentFilter(e.target.value)}
              aria-label={lang === "en" ? "Equipment" : "সরঞ্জাম"}
            >
              <option value="all">{lang === "en" ? "All Equipment" : "সব সরঞ্জাম"}</option>
              {availableEquipments.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          className="lang-toggle" 
          onClick={() => setLang(l => l === "en" ? "bn" : "en")}
          aria-label="Toggle language"
        >
          {lang === "en" ? "EN / বাং" : "বাং / EN"}
        </button>
      </div>

      {filteredGuides.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} aria-hidden="true" />
          <h2>{lang === "en" ? "No exercises found" : "কোনো ব্যায়াম পাওয়া যায়নি"}</h2>
          <p>{lang === "en" ? "Try adjusting your filters to see more results." : "আরও ফলাফল দেখতে আপনার ফিল্টার পরিবর্তন করার চেষ্টা করুন।"}</p>
        </div>
      ) : (
        <div className="exercise-grid">
          {filteredGuides.map(ex => (
            <div 
              key={ex.id} 
              className={`exercise-card ${selectedExerciseId === ex.id ? "active" : ""}`}
              onClick={() => setSelectedExerciseId(ex.id)}
            >
              <div className="exercise-card-header">
                <h3 style={{ textTransform: 'capitalize' }}>{getExerciseName(ex)}</h3>
                <ChevronRight size={20} style={{ opacity: 0.5 }} />
              </div>
              <div className="exercise-card-meta">
                <StatusPill tone="neutral">{ex.difficulty}</StatusPill>
                {ex.equipment.map(eq => (
                  <StatusPill key={eq} tone="neutral">{eq}</StatusPill>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedExercise && (
        <div className="detail-backdrop" onClick={() => setSelectedExerciseId(null)}>
          <div className="detail-view" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h2 style={{ textTransform: 'capitalize' }}>{getExerciseName(selectedExercise)}</h2>
              <button className="close-button" onClick={() => setSelectedExerciseId(null)} aria-label="Close details">
                <X size={24} />
              </button>
            </div>

          <div className="detail-sections">
            {selectedExercise.gifUrl && (
              <div className="detail-section section-media" style={{ textAlign: "center", marginBottom: "1rem" }}>
                <img 
                  src={"https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/master/" + selectedExercise.gifUrl} 
                  alt={getExerciseName(selectedExercise)} 
                  style={{ maxWidth: "100%", borderRadius: "8px" }} 
                  onError={(e) => {
                    // Hide if broken
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {selectedExercise.setupSteps && selectedExercise.setupSteps.length > 0 && (
              <div className="detail-section section-setup">
                <h4><RefreshCw size={18} /> {lang === "en" ? "Instructions" : "নির্দেশাবলী"}</h4>
                <ul>
                  {selectedExercise.setupSteps.map((step, idx) => (
                    <li key={idx}>{parseLang(step)}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedExercise.movementSteps && selectedExercise.movementSteps.length > 0 && (
              <div className="detail-section section-movement">
                <h4><Play size={18} /> {lang === "en" ? "Movement" : "মুভমেন্ট"}</h4>
                <ul>
                  {selectedExercise.movementSteps.map((step, idx) => (
                    <li key={idx}>{parseLang(step)}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedExercise.commonMistakes && selectedExercise.commonMistakes.length > 0 && (
              <div className="detail-section section-mistakes">
                <h4><ShieldAlert size={18} /> {lang === "en" ? "Common Mistakes" : "সাধারণ ভুল"}</h4>
                <ul>
                  {selectedExercise.commonMistakes.map((step, idx) => (
                    <li key={idx}>{parseLang(step)}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedExercise.safetyCues && selectedExercise.safetyCues.length > 0 && (
              <div className="detail-section section-safety">
                <h4><Activity size={18} /> {lang === "en" ? "Safety Cues" : "নিরাপত্তা সতর্কতা"}</h4>
                <ul>
                  {selectedExercise.safetyCues.map((step, idx) => (
                    <li key={idx}>{parseLang(step)}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedExercise.cameraGuidance && selectedExercise.cameraGuidance.length > 0 && (
              <div className="detail-section section-camera">
                <h4><Video size={18} /> {lang === "en" ? "Camera Guidance" : "ক্যামেরা নির্দেশিকা"}</h4>
                <ul>
                  {selectedExercise.cameraGuidance.map((step, idx) => (
                    <li key={idx}>{parseLang(step)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </section>
  );
}
