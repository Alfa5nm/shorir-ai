import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { HomeRoute } from "../routes/HomeRoute";

const AboutCompetitionRoute = lazy(() =>
  import("../routes/AboutCompetitionRoute").then((module) => ({ default: module.AboutCompetitionRoute }))
);
const CoachRoute = lazy(() =>
  import("../routes/CoachRoute").then((module) => ({ default: module.CoachRoute }))
);
const DietChartRoute = lazy(() =>
  import("../routes/DietChartRoute").then((module) => ({ default: module.DietChartRoute }))
);
const ExerciseLibraryRoute = lazy(() =>
  import("../routes/ExerciseLibraryRoute").then((module) => ({ default: module.ExerciseLibraryRoute }))
);
const MealRoute = lazy(() =>
  import("../routes/MealRoute").then((module) => ({ default: module.MealRoute }))
);
const OnboardingRoute = lazy(() =>
  import("../routes/OnboardingRoute").then((module) => ({ default: module.OnboardingRoute }))
);
const PhoneCameraRoute = lazy(() =>
  import("../routes/PhoneCameraRoute").then((module) => ({ default: module.PhoneCameraRoute }))
);
const PresentationRoute = lazy(() =>
  import("../routes/PresentationRoute").then((module) => ({ default: module.PresentationRoute }))
);
const ProgressRoute = lazy(() =>
  import("../routes/ProgressRoute").then((module) => ({ default: module.ProgressRoute }))
);
const QrCaptureRoute = lazy(() =>
  import("../routes/QrCaptureRoute").then((module) => ({ default: module.QrCaptureRoute }))
);
const ReportRoute = lazy(() =>
  import("../routes/ReportRoute").then((module) => ({ default: module.ReportRoute }))
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Suspense fallback={<section className="panel loading-state">Loading view...</section>}>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route path="/coach" element={<CoachRoute />} />
            <Route path="/exercise-library" element={<ExerciseLibraryRoute />} />
            <Route path="/diet-chart" element={<DietChartRoute />} />
            <Route path="/progress" element={<ProgressRoute />} />
            <Route path="/meal" element={<MealRoute />} />
            <Route path="/calorie-check" element={<MealRoute />} />
            <Route path="/capture/:id" element={<QrCaptureRoute />} />
            <Route path="/phone-camera/:id" element={<PhoneCameraRoute />} />
            <Route path="/presentation" element={<PresentationRoute />} />
            <Route path="/report" element={<ReportRoute />} />
            <Route path="/about-competition" element={<AboutCompetitionRoute />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </BrowserRouter>
  );
}
