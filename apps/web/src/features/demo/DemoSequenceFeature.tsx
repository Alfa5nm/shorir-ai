import { Link } from "react-router-dom";
import { useState } from "react";
import { Badge } from "../../components/ui/badge";
import { ButtonLink } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { demoSequence } from "./demoSequence";

type DemoView = "walkthrough" | "script" | "checks";

export function DemoSequenceFeature() {
  const [activeView, setActiveView] = useState<DemoView>("walkthrough");

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

      <Tabs className="demo-tabs">
        <TabsList aria-label="Demo views">
          <TabsTrigger active={activeView === "walkthrough"} onClick={() => setActiveView("walkthrough")}>
            Walkthrough
          </TabsTrigger>
          <TabsTrigger active={activeView === "script"} onClick={() => setActiveView("script")}>
            Presenter script
          </TabsTrigger>
          <TabsTrigger active={activeView === "checks"} onClick={() => setActiveView("checks")}>
            Acceptance checks
          </TabsTrigger>
        </TabsList>

        {activeView === "walkthrough" && (
          <TabsContent>
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
                        <div>
                          <dt>Presenter cue</dt>
                          <dd>{step.presenterCue}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}

        {activeView === "script" && (
          <TabsContent>
            <Card className="demo-script">
              <CardHeader>
                <Badge variant="outline">4-5 minutes</Badge>
                <h2>Use this speaking flow</h2>
              </CardHeader>
              <CardContent>
                <ol>
                  {demoSequence.map((step) => (
                    <li key={step.id}>
                      <strong>{step.title}</strong>
                      <span>{step.presenterCue}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {activeView === "checks" && (
          <TabsContent>
            <div className="demo-checks">
              <Card>
                <CardHeader>
                  <h2>Live coaching</h2>
                </CardHeader>
                <CardContent>
                  <p>Valid squats, push-ups, and lunges count only after stable setup, ordered movement, and full depth.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <h2>Food review</h2>
                </CardHeader>
                <CardContent>
                  <p>Desktop upload and phone QR capture both reach the calorie review route with confidence and macro estimates.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <h2>Submission</h2>
                </CardHeader>
                <CardContent>
                  <p>Use the live URL, demo video, project presentation, technical report, and source ZIP from the deliverables folder.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
}
