import { useAppServices } from "../../app/providers";

export function ReportFeature() {
  const { contentSource } = useAppServices();
  const report = contentSource.getReportContent();

  return (
    <section className="panel">
      <h1>{report.title}</h1>
      {report.sections.map((section) => (
        <article className="report-section" key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </article>
      ))}
    </section>
  );
}
