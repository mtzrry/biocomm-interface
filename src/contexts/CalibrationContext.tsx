import { createContext, useContext, useState, type ReactNode } from "react";

export interface CalibrationSymbol {
  character: string; // "DOT" | "DASH"
  min_duration_s: number;
  max_duration_s: number;
  avg_ph_drop: number;
  avg_od_spike: number;
}

export interface CalibrationDictEntry {
  character: string; // "A", "B", etc.
  morse_code: string; // ".-"
}

interface CalibrationState {
  symbols: CalibrationSymbol[];
  dictionary: CalibrationDictEntry[];
  loaded: boolean;
  fileName: string;
  setCalibration: (symbols: CalibrationSymbol[], dictionary: CalibrationDictEntry[], fileName: string) => void;
  clearCalibration: () => void;
}

const CalibrationContext = createContext<CalibrationState | null>(null);

export function useCalibration() {
  const ctx = useContext(CalibrationContext);
  if (!ctx) throw new Error("useCalibration must be used within CalibrationProvider");
  return ctx;
}

export function parseCalibrationCsv(csvText: string): {
  symbols: CalibrationSymbol[];
  dictionary: CalibrationDictEntry[];
} {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return { symbols: [], dictionary: [] };

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const expectedCols = ["type", "character", "morse_code", "min_duration_s", "max_duration_s", "avg_ph_drop", "avg_od_spike"];
  const colMap: Record<string, number> = {};

  for (const col of expectedCols) {
    const idx = header.indexOf(col);
    if (idx === -1) return { symbols: [], dictionary: [] };
    colMap[col] = idx;
  }

  const symbols: CalibrationSymbol[] = [];
  const dictionary: CalibrationDictEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < expectedCols.length) continue;

    const type = cols[colMap["type"]].toLowerCase();
    const character = cols[colMap["character"]].toUpperCase();
    const morse_code = cols[colMap["morse_code"]];

    if (type === "symbol") {
      symbols.push({
        character,
        min_duration_s: parseFloat(cols[colMap["min_duration_s"]]),
        max_duration_s: parseFloat(cols[colMap["max_duration_s"]]),
        avg_ph_drop: parseFloat(cols[colMap["avg_ph_drop"]]),
        avg_od_spike: parseFloat(cols[colMap["avg_od_spike"]]),
      });
    } else if (type === "dictionary") {
      dictionary.push({ character, morse_code });
    }
  }

  return { symbols, dictionary };
}

export function CalibrationProvider({ children }: { children: ReactNode }) {
  const [symbols, setSymbols] = useState<CalibrationSymbol[]>([]);
  const [dictionary, setDictionary] = useState<CalibrationDictEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [fileName, setFileName] = useState("");

  const setCalibration = (s: CalibrationSymbol[], d: CalibrationDictEntry[], fn: string) => {
    setSymbols(s);
    setDictionary(d);
    setLoaded(true);
    setFileName(fn);
  };

  const clearCalibration = () => {
    setSymbols([]);
    setDictionary([]);
    setLoaded(false);
    setFileName("");
  };

  return (
    <CalibrationContext.Provider value={{ symbols, dictionary, loaded, fileName, setCalibration, clearCalibration }}>
      {children}
    </CalibrationContext.Provider>
  );
}
