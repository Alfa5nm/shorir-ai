import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import { ButtonLink } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { demoSequence } from "./demoSequence";

export function DemoSequenceFeature() {
  return (
    <section className="demo-page">
      <header className="feature-header demo-page__header">
        <Badge variant="secondary">First-time demo</Badge>
        <h1>Demo sequence</h1>
        <p>
          A guided showcase flow for judges, testers, and first-time users. Follow it top to bottom to show the
          complete SHORIR AI loop in under five minutes.
        </p>
        <div className="demo-page__actions">
          <ButtonLink to="/onboarding">Start profile setup</ButtonLink>
          <ButtonLink to="/coach?exercise=squat" variant="secondary">Jump to coach</ButtonLink>
        </div>
      </header>

      <div className="demo-sequence">
        {demoSequence.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card className="demo-step" key={step.id}>
              <CardHeader>
                <span className="demo-step__index">{String(index + 1).padStart(2, "0")}</span>
                <Icon size={22} aria-hidden={true} />
                <div>
                  <h2>{step.title}</h2>
                  <Link to={step.route}>{step.route}</Link>
                </div>
              </CardHeader>
              <CardContent>
                <dl>
                  <div>
                    <dt>Action</dt>
                    <dd>{step.action}</dd>
                  </div>
                  <div>
                    <dt>Result</dt>
                    <dd>{step.result}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
