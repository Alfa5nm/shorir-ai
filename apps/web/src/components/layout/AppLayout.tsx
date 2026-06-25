import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { BrandStrip } from "../branding/BrandStrip";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/coach", label: "Pose Coach" },
  { href: "/exercise-library", label: "Exercises" },
  { href: "/diet-chart", label: "Diet Chart" },
  { href: "/calorie-check", label: "Calorie Check" },
  { href: "/progress", label: "Progress" },
  { href: "/presentation", label: "Presentation" },
  { href: "/report", label: "Report" }
];

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <BrandStrip />
        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.href} to={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page-shell">{children}</main>
    </div>
  );
}
