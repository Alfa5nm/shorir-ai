import { useEffect, useState } from "react";
import { useAppServices } from "../app/providers";
import { StatusPill } from "../components/ui/StatusPill";

export function HomeRoute() {
  const { apiClient, contentSource } = useAppServices();
  const content = contentSource.getProductContent();
  const [health, setHealth] = useState("checking");

  useEffect(() => {
    apiClient
      .getHealth()
      .then((result) => setHealth(result.ok ? "connected" : "unhealthy"))
      .catch(() => setHealth("offline"));
  }, [apiClient]);

  return (
    <section className="hero" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <StatusPill tone={health === "connected" ? "success" : "warning"}>API {health}</StatusPill>
      <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        <img src="/images/logo_nobg.png" alt="Shorir AI Logo" style={{ maxWidth: '300px', height: 'auto' }} />
      </div>
      <h1>{content.title}</h1>
      <p>{content.tagline}</p>
      <div className="hero-actions" style={{ justifyContent: 'center' }}>
        <a href="/onboarding">Start onboarding</a>
        <a href="/coach">Open pose coach</a>
        <a href="/meal">Review a meal</a>
        <a href="/progress">View progress</a>
      </div>
    </section>
  );
}
