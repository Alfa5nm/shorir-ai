import { rulebookContent } from "@shorir/content";

export function AboutCompetitionRoute() {
  return (
    <section className="panel">
      <h1>{rulebookContent.event}</h1>
      <p>{rulebookContent.taskTitle}</p>
      <div className="asset-row" aria-label="Provided event assets">
        <img src="/branding/Mindsparks 26 Logo.png" alt="Mindsparks 26 logo placeholder" />
        <img src="/branding/Code front.png" alt="CodeFront asset placeholder" />
        <img src="/branding/AUST IDC - Black.png" alt="AUST IDC logo placeholder" />
      </div>
      <h2>Requirement checklist</h2>
      <ul>
        {rulebookContent.requirements.map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </ul>
    </section>
  );
}
