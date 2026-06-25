import { DietChartFeature } from "../features/diet-chart/DietChartFeature";

export function DietChartRoute() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Diet Chart</h1>
      </header>
      <DietChartFeature />
    </div>
  );
}
