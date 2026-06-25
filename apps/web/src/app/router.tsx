import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AboutCompetitionRoute } from "../routes/AboutCompetitionRoute";
import { CoachRoute } from "../routes/CoachRoute";
import { DietChartRoute } from "../routes/DietChartRoute";
import { ExerciseLibraryRoute } from "../routes/ExerciseLibraryRoute";
import { HomeRoute } from "../routes/HomeRoute";
import { MealRoute } from "../routes/MealRoute";
import { OnboardingRoute } from "../routes/OnboardingRoute";
import { PhoneCameraRoute } from "../routes/PhoneCameraRoute";
import { PresentationRoute } from "../routes/PresentationRoute";
import { ProgressRoute } from "../routes/ProgressRoute";
import { QrCaptureRoute } from "../routes/QrCaptureRoute";
import { ReportRoute } from "../routes/ReportRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route path="/coach" element={<CoachRoute />} />
          <Route path="/exercise-library" element={<ExerciseLibraryRoute />} />
          <Route path="/diet-chart" element={<DietChartRoute />} />
          <Route path="/progress" element={<ProgressRoute />} />
          <Route path="/meal" element={<MealRoute />} />
          <Route path="/capture/:id" element={<QrCaptureRoute />} />
          <Route path="/phone-camera/:id" element={<PhoneCameraRoute />} />
          <Route path="/presentation" element={<PresentationRoute />} />
          <Route path="/report" element={<ReportRoute />} />
          <Route path="/about-competition" element={<AboutCompetitionRoute />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
