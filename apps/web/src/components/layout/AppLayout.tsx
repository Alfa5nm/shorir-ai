import {
  Apple,
  BarChart3,
  BookOpen,
  Camera,
  ClipboardList,
  Dumbbell,
  FileText,
  Home,
  Moon,
  Presentation,
  Settings2,
  Sun
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { BrandStrip } from "../branding/BrandStrip";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/coach", label: "Pose Coach", icon: Camera },
  { href: "/exercise-library", label: "Exercises", icon: Dumbbell },
  { href: "/diet-chart", label: "Diet Chart", icon: Apple },
  { href: "/calorie-check", label: "Calorie Check", icon: ClipboardList },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/onboarding", label: "Profile", icon: Settings2 },
  { href: "/presentation", label: "Presentation", icon: Presentation },
  { href: "/report", label: "Report", icon: FileText }
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = window.localStorage.getItem("shorir-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("shorir-theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <BrandStrip />
        <div className="navigation-row">
          <nav className="site-nav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.href} to={item.href} title={item.label}>
                  <Icon size={17} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <button
            className="theme-toggle"
            type="button"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>
      <main className="page-shell">{children}</main>
      <footer className="site-footer">
        <div>
          <span>SHORIR AI</span>
          <p>AI-assisted fitness guidance built for Mindsparks 26 CodeFront Challenge.</p>
        </div>
        <Link to="/about-competition">
          <BookOpen size={16} />
          Project & competition
        </Link>
      </footer>
    </div>
  );
}
