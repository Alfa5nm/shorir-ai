import {
  Apple,
  BarChart3,
  BookOpen,
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
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAppLanguage } from "../../app/language";
import { BrandStrip } from "../branding/BrandStrip";

const navItems = [
  { href: "/", label: "Dashboard", labelBn: "ড্যাশবোর্ড", icon: Home },
  { href: "/coach", label: "Pose Coach", labelBn: "পোজ কোচ", icon: Camera },
  { href: "/exercise-library", label: "Exercises", labelBn: "এক্সারসাইজ", icon: Dumbbell },
  { href: "/diet-chart", label: "Diet Chart", labelBn: "ডায়েট চার্ট", icon: Apple },
  { href: "/calorie-check", label: "Calorie Check", labelBn: "ক্যালরি চেক", icon: ClipboardList },
  { href: "/progress", label: "Progress", labelBn: "প্রগ্রেস", icon: BarChart3 },
  { href: "/demo", label: "Demo", labelBn: "ডেমো", icon: MonitorPlay },
  { href: "/onboarding", label: "Profile", labelBn: "প্রোফাইল", icon: Settings2 }
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
          <div className="language-toggle" aria-label={t("Language", "ভাষা")}>
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
              বাংলা
            </button>
          </div>
          <button
            className="theme-toggle"
            type="button"
            title={t(
              `Switch to ${theme === "light" ? "dark" : "light"} mode`,
              `${theme === "light" ? "ডার্ক" : "লাইট"} মোডে যান`
            )}
            aria-label={t(
              `Switch to ${theme === "light" ? "dark" : "light"} mode`,
              `${theme === "light" ? "ডার্ক" : "লাইট"} মোডে যান`
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
          <p>{t("AI-assisted fitness guidance built for Mindsparks 26 CodeFront Challenge.", "Mindsparks 26 CodeFront Challenge-এর জন্য তৈরি AI-সহায়ক ফিটনেস গাইড।")}</p>
        </div>
        <div className="site-footer__marks" aria-label="Mindsparks 26 CodeFront Challenge by AUST IDC">
          <img src="/branding/Mindsparks 26 Logo.png" alt="Mindsparks 26" />
          <img src="/branding/Code front.png" alt="CodeFront Challenge" />
          <img src="/branding/AUST IDC - Black.png" alt="AUST Innovation and Design Club" />
        </div>
        <Link to="/about-competition">
          <BookOpen size={16} />
          {t("Project & competition", "প্রজেক্ট ও প্রতিযোগিতা")}
        </Link>
      </footer>
    </div>
  );
}
