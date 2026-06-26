import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { HomeRoute } from "../routes/HomeRoute";

const CoachRoute = lazy(() =>
  import("../routes/CoachRoute").then((module) => ({ default: module.CoachRoute }))
);
const DietChartRoute = lazy(() =>
  import("../routes/DietChartRoute").then((module) => ({ default: module.DietChartRoute }))
);
const DemoRoute = lazy(() =>
  import("../routes/DemoRoute").then((module) => ({ default: module.DemoRoute }))
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
const ProgressRoute = lazy(() =>
  import("../routes/ProgressRoute").then((module) => ({ default: module.ProgressRoute }))
);
const QrCaptureRoute = lazy(() =>
  import("../routes/QrCaptureRoute").then((module) => ({ default: module.QrCaptureRoute }))
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
            <Route path="/demo" element={<DemoRoute />} />
            <Route path="/meal" element={<MealRoute />} />
            <Route path="/calorie-check" element={<MealRoute />} />
            <Route path="/capture/:id" element={<QrCaptureRoute />} />
            <Route path="/phone-camera/:id" element={<PhoneCameraRoute />} />
            <Route path="*" element={<HomeRoute />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </BrowserRouter>
  );
}
