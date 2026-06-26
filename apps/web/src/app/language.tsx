import type { LanguagePreference } from "@shorir/contracts";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "en" | "bn";

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (english: string, bangla: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function normalizeLanguage(language: LanguagePreference | AppLanguage | null | undefined): AppLanguage {
  return language === "bn" ? "bn" : "en";
}

export function AppLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = window.localStorage.getItem("shorir-language");
    return saved === "bn" ? "bn" : "en";
  });

  useEffect(() => {
    document.documentElement.lang = language === "bn" ? "bn" : "en";
    window.localStorage.setItem("shorir-language", language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (english, bangla) => (language === "bn" ? bangla : english)
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAppLanguage() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useAppLanguage must be used inside AppLanguageProvider");
  }
  return value;
}
