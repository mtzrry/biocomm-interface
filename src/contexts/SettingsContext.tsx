import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Theme = "light" | "dark";
export type FontSize = "small" | "medium" | "large";
export type FontFamily = "inter" | "roboto";

interface SettingsState {
  theme: Theme;
  fontSize: FontSize;
  fontFamily: FontFamily;
  setTheme: (t: Theme) => void;
  setFontSize: (s: FontSize) => void;
  setFontFamily: (f: FontFamily) => void;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("bdt-theme") as Theme) || "light");
  const [fontSize, setFontSize] = useState<FontSize>(() => (localStorage.getItem("bdt-fontSize") as FontSize) || "medium");
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => (localStorage.getItem("bdt-fontFamily") as FontFamily) || "inter");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("bdt-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-size", fontSize);
    localStorage.setItem("bdt-fontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-font-family", fontFamily);
    localStorage.setItem("bdt-fontFamily", fontFamily);
  }, [fontFamily]);

  return (
    <SettingsContext.Provider value={{ theme, fontSize, fontFamily, setTheme, setFontSize, setFontFamily }}>
      {children}
    </SettingsContext.Provider>
  );
}
