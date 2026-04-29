import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface OrganismProfile {
  organism_name: string;
  type: string;
  baseline_ph: number;
  baseline_od: number;
  threshold_od: number;
}

// Default: Saccharomyces cerevisiae
const DEFAULT_PROFILE: OrganismProfile = {
  organism_name: "Saccharomyces cerevisiae",
  type: "yeast",
  baseline_ph: 7.0,
  baseline_od: 0.3,
  threshold_od: 0.6,
};

const LS_KEY_PROFILE = "micorse-calibration-profile";

function loadProfileFromStorage(): OrganismProfile {
  try {
    const raw = localStorage.getItem(LS_KEY_PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    const baseline_ph = parseFloat(parsed.baseline_ph);
    const baseline_od = parseFloat(parsed.baseline_od);
    const threshold_od = parseFloat(parsed.threshold_od);
    if ([baseline_ph, baseline_od, threshold_od].some((v) => isNaN(v))) return DEFAULT_PROFILE;
    return {
      organism_name: String(parsed.organism_name ?? DEFAULT_PROFILE.organism_name),
      type: String(parsed.type ?? DEFAULT_PROFILE.type),
      baseline_ph,
      baseline_od,
      threshold_od,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

interface CalibrationState {
  profile: OrganismProfile;
  loaded: boolean;
  fileName: string;
  setProfile: (profile: OrganismProfile, fileName: string) => void;
  updateParam: (key: keyof Pick<OrganismProfile, "baseline_ph" | "baseline_od" | "threshold_od">, value: number) => void;
  clearProfile: () => void;
}

const CalibrationContext = createContext<CalibrationState | null>(null);

export function useCalibration() {
  const ctx = useContext(CalibrationContext);
  if (!ctx) throw new Error("useCalibration must be used within CalibrationProvider");
  return ctx;
}

const ORGANISM_HEADERS = ["organism_name", "type", "baseline_ph", "baseline_od", "threshold_od"];

export function parseOrganismCsv(csvText: string): OrganismProfile | null {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return null;

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const colMap: Record<string, number> = {};

  for (const col of ORGANISM_HEADERS) {
    const idx = header.indexOf(col);
    if (idx === -1) return null;
    colMap[col] = idx;
  }

  const cols = lines[1].split(",").map((c) => c.trim());
  if (cols.length < ORGANISM_HEADERS.length) return null;

  const baseline_ph = parseFloat(cols[colMap["baseline_ph"]]);
  const baseline_od = parseFloat(cols[colMap["baseline_od"]]);
  const threshold_od = parseFloat(cols[colMap["threshold_od"]]);

  if ([baseline_ph, baseline_od, threshold_od].some((v) => isNaN(v))) return null;

  return {
    organism_name: cols[colMap["organism_name"]],
    type: cols[colMap["type"]],
    baseline_ph,
    baseline_od,
    threshold_od,
  };
}

export function isOrganismCsv(csvText: string): boolean {
  const firstLine = csvText.trim().split("\n")[0]?.toLowerCase() || "";
  return ORGANISM_HEADERS.every((h) => firstLine.includes(h));
}

export function CalibrationProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<OrganismProfile>(() => loadProfileFromStorage());
  const [loaded, setLoaded] = useState(() => !!localStorage.getItem(LS_KEY_PROFILE));
  const [fileName, setFileName] = useState("");

  // Auto-persist profile to localStorage on any change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_PROFILE, JSON.stringify(profile));
    } catch {
      /* ignore quota errors */
    }
  }, [profile]);

  const setProfile = (p: OrganismProfile, fn: string) => {
    setProfileState(p);
    setLoaded(true);
    setFileName(fn);
  };

  const updateParam = (key: keyof Pick<OrganismProfile, "baseline_ph" | "baseline_od" | "threshold_od">, value: number) => {
    setProfileState((prev) => ({ ...prev, [key]: value }));
  };

  const clearProfile = () => {
    setProfileState(DEFAULT_PROFILE);
    setLoaded(false);
    setFileName("");
    try {
      localStorage.removeItem(LS_KEY_PROFILE);
    } catch {
      /* ignore */
    }
  };

  return (
    <CalibrationContext.Provider value={{ profile, loaded, fileName, setProfile, updateParam, clearProfile }}>
      {children}
    </CalibrationContext.Provider>
  );
}
