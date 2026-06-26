import {
  Apple,
  BarChart3,
  Camera,
  ClipboardList,
  Dumbbell,
  Home,
  MonitorPlay,
  Moon,
  Settings2,
  Sun
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAppLanguage } from "../../app/language";
import { BrandStrip } from "../branding/BrandStrip";

const navItems = [
  { href: "/", label: "Dashboard", labelBn: "\u09a1\u09cd\u09af\u09be\u09b6\u09ac\u09cb\u09b0\u09cd\u09a1", icon: Home },
  { href: "/coach", label: "Pose Coach", labelBn: "\u09aa\u09cb\u099c \u0995\u09cb\u099a", icon: Camera },
  { href: "/exercise-library", label: "Exercises", labelBn: "\u098f\u0995\u09cd\u09b8\u09be\u09b0\u09b8\u09be\u0987\u099c", icon: Dumbbell },
  { href: "/diet-chart", label: "Diet Chart", labelBn: "\u09a1\u09be\u09df\u09c7\u099f \u099a\u09be\u09b0\u09cd\u099f", icon: Apple },
  { href: "/calorie-check", label: "Calorie Check", labelBn: "\u0995\u09cd\u09af\u09be\u09b2\u09b0\u09bf \u099a\u09c7\u0995", icon: ClipboardList },
  { href: "/progress", label: "Progress", labelBn: "\u09aa\u09cd\u09b0\u0997\u09cd\u09b0\u09c7\u09b8", icon: BarChart3 },
  { href: "/demo", label: "Demo", labelBn: "\u09a1\u09c7\u09ae\u09cb", icon: MonitorPlay },
  { href: "/onboarding", label: "Profile", labelBn: "\u09aa\u09cd\u09b0\u09cb\u09ab\u09be\u0987\u09b2", icon: Settings2 }
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isCoachRoute = location.pathname === "/coach";
  const { language, setLanguage, t } = useAppLanguage();
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
    <div className={`app-shell${isCoachRoute ? " app-shell--coach" : ""}`}>
      <header className="site-header">
        <BrandStrip />
        <div className="navigation-row">
          <nav className="site-nav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const label = t(item.label, item.labelBn);
              return (
                <NavLink key={item.href} to={item.href} title={label}>
                  <Icon size={17} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="language-toggle" aria-label={t("Language", "\u09ad\u09be\u09b7\u09be")}>
            <button
              type="button"
              className={language === "en" ? "is-active" : ""}
              onClick={() => setLanguage("en")}
              aria-pressed={language === "en"}
            >
              EN
            </button>
            <button
              type="button"
              className={language === "bn" ? "is-active" : ""}
              onClick={() => setLanguage("bn")}
              aria-pressed={language === "bn"}
            >
              {"\u09ac\u09be\u0982\u09b2\u09be"}
            </button>
          </div>
          <button
            className="theme-toggle"
            type="button"
            title={t(
              `Switch to ${theme === "light" ? "dark" : "light"} mode`,
              `${theme === "light" ? "\u09a1\u09be\u09b0\u09cd\u0995" : "\u09b2\u09be\u0987\u099f"} \u09ae\u09cb\u09a1\u09c7 \u09af\u09be\u09a8`
            )}
            aria-label={t(
              `Switch to ${theme === "light" ? "dark" : "light"} mode`,
              `${theme === "light" ? "\u09a1\u09be\u09b0\u09cd\u0995" : "\u09b2\u09be\u0987\u099f"} \u09ae\u09cb\u09a1\u09c7 \u09af\u09be\u09a8`
            )}
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
          <p>
            {t(
              "AI-assisted fitness guidance built for Mindsparks 26 CodeFront Challenge.",
              "Mindsparks 26 CodeFront Challenge-\u098f\u09b0 \u099c\u09a8\u09cd\u09af \u09a4\u09c8\u09b0\u09bf AI-\u09b8\u09b9\u09be\u09df\u0995 \u09ab\u09bf\u099f\u09a8\u09c7\u09b8 \u0997\u09be\u0987\u09a1\u0964"
            )}
          </p>
        </div>
        <div className="site-footer__marks" aria-label="Mindsparks 26 CodeFront Challenge by AUST IDC">
          <img src="/branding/Mindsparks 26 Logo.png" alt="Mindsparks 26" />
          <img src="/branding/Code front.png" alt="CodeFront Challenge" />
          <img src="/branding/AUST IDC - Black.png" alt="AUST Innovation and Design Club" />
        </div>
      </footer>
    </div>
  );
}
