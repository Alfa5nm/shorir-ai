import { ArrowLeft, ArrowRight, ExternalLink, Pause, Play, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import { Button, ButtonLink } from "../../components/ui/button";
import { demoSequence, type DemoScene } from "./demoSequence";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
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
    setActiveIndex((index + demoSequence.length) % demoSequence.length);
  }

  function previous() {
    goTo(activeIndex - 1);
  }

  function next() {
    goTo(activeIndex + 1);
  }

  const Icon = activeScene.icon;

  return (
    <section className="demo-page demo-page--interactive">
      <header className="feature-header demo-page__header demo-hero">
        <Badge variant="secondary">Interactive showcase</Badge>
        <h1>Guided product tour</h1>
        <p>
          A cinematic walkthrough for judges and first-time users, with live highlights, focal depth, and a guided
          cursor that points to the product story without turning the screen into a checklist.
        </p>
        <div className="demo-page__actions">
          <ButtonLink to="/onboarding">Start profile setup</ButtonLink>
          <ButtonLink to="/coach?exercise=squat" variant="secondary">Jump to coach</ButtonLink>
        </div>
      </header>

      <div className="demo-tour-shell">
        <aside className="demo-tour-rail" aria-label="Demo scenes">
          <div className="demo-tour-rail__header">
            <Sparkles size={18} aria-hidden="true" />
            <span>Tour scenes</span>
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
                <strong>{scene.title}</strong>
              </button>
            );
          })}
        </aside>

        <article className="demo-tour-stage" style={stageStyle}>
          <div className="demo-tour-stage__topline">
            <div>
              <span>{progressLabel}</span>
              <h2>{activeScene.title}</h2>
            </div>
            <Link to={activeScene.route}>
              Open live route
              <ExternalLink size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="demo-viewport" key={activeScene.id}>
            <img src={activeScene.frame} alt={`${activeScene.title} app preview`} />
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
              <p>{activeScene.caption}</p>
            </div>
          </div>

          <div className="demo-tour-copy">
            <div>
              <span>Focus point</span>
              <strong>{activeScene.callout}</strong>
            </div>
            <div className="demo-tour-controls" aria-label="Tour playback controls">
              <Button type="button" variant="outline" size="sm" onClick={previous}>
                <ArrowLeft size={16} aria-hidden="true" />
                Back
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsPlaying((current) => !current)}>
                {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button type="button" size="sm" onClick={next}>
                Next
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
