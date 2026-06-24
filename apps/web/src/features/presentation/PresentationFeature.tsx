import { useAppServices } from "../../app/providers";

export function PresentationFeature() {
  const { contentSource } = useAppServices();
  const presentation = contentSource.getPresentationContent();

  return (
    <section className="panel">
      <h1>{presentation.title}</h1>
      <div className="grid">
        {presentation.slides.map((slide) => (
          <article className="card" key={slide.title}>
            <h2>{slide.title}</h2>
            <ul>
              {slide.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
