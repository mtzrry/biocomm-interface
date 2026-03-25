import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Theme = "light" | "dark";
export type FontSize = "small" | "medium" | "large";
export type FontFamily = "inter" | "roboto";
export type AccentTheme = "emerald" | "blue" | "rose";

interface SettingsState {
  theme: Theme;
  fontSize: FontSize;
  fontFamily: FontFamily;
  accentTheme: AccentTheme;
  setTheme: (t: Theme) => void;
  setFontSize: (s: FontSize) => void;
  setFontFamily: (f: FontFamily) => void;
  setAccentTheme: (a: AccentTheme) => void;
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
  const [accentTheme, setAccentTheme] = useState<AccentTheme>(() => (localStorage.getItem("bdt-accent") as AccentTheme) || "emerald");

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

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-accent", accentTheme);
    localStorage.setItem("bdt-accent", accentTheme);
  }, [accentTheme]);

  return (
    <SettingsContext.Provider value={{ theme, fontSize, fontFamily, accentTheme, setTheme, setFontSize, setFontFamily, setAccentTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}
