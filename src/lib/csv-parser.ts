import type { OrganismProfile } from "@/contexts/CalibrationContext";

export interface CsvSignalPoint {
  t: number;
  signal: number;
  threshold: number;
}

export interface ScientificCsvPoint {
  time_s: number;
  sound_freq_hz: number;
  ph_level: number;
  od600: number;
  color_intensity: number;
}

/** Standard Morse code dictionary */
const MORSE_DICT: Record<string, string> = {
  ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E",
  "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J",
  "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O",
  ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T",
  "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y",
  "--..": "Z",
};

/** Legacy parser for simple time,signal CSVs */
export function parseCsvToSignalData(
  csvText: string,
  threshold: number
): CsvSignalPoint[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());

  const signalAliases = ["signal", "value", "intensity", "od", "absorbance", "od600", "fluorescence"];
  const timeAliases = ["t", "time", "tick", "sample", "index", "seconds", "minutes"];

  let signalIdx = header.findIndex((h) => signalAliases.includes(h));
  let timeIdx = header.findIndex((h) => timeAliases.includes(h));

  if (signalIdx === -1) signalIdx = header.length > 1 ? 1 : 0;
  if (timeIdx === -1) timeIdx = 0;

  const data: CsvSignalPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const t = parseFloat(cols[timeIdx]);
    const signal = parseFloat(cols[signalIdx]);

    if (!isNaN(t) && !isNaN(signal)) {
      data.push({
        t,
        signal: Math.max(0, Math.min(1, signal)),
        threshold,
      });
    }
  }

  return data;
}

/** Scientific parser for Harris et al. 2021 format */
export function parseScientificCsv(csvText: string): ScientificCsvPoint[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());

  const colMap: Record<string, number> = {};
  const requiredCols = ["time_s", "sound_freq_hz", "ph_level", "od600", "color_intensity"];

  for (const col of requiredCols) {
    const idx = header.indexOf(col);
    if (idx === -1) return [];
    colMap[col] = idx;
  }

  const data: ScientificCsvPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const time_s = parseFloat(cols[colMap["time_s"]]);
    const sound_freq_hz = parseFloat(cols[colMap["sound_freq_hz"]]);
    const ph_level = parseFloat(cols[colMap["ph_level"]]);
    const od600 = parseFloat(cols[colMap["od600"]]);
    const color_intensity = parseFloat(cols[colMap["color_intensity"]]);

    if ([time_s, sound_freq_hz, ph_level, od600, color_intensity].every((v) => !isNaN(v))) {
      data.push({ time_s, sound_freq_hz, ph_level, od600, color_intensity });
    }
  }

  return data;
}

/** Detect if CSV has scientific headers */
export function isScientificCsv(csvText: string): boolean {
  const firstLine = csvText.trim().split("\n")[0]?.toLowerCase() || "";
  return firstLine.includes("time_s") && firstLine.includes("sound_freq_hz");
}

export interface DecodeResult {
  symbols: string[];  // "·" or "−" or " "
  decoded: string;
  letters: { char: string; morse: string }[];
}

/** Decode bio-signal from scientific data.
 *  Supports optional calibration model for dynamic thresholds. */
export function decodeBioSignal(
  data: ScientificCsvPoint[],
  od600Threshold: number = 0.3,
  calibrationSymbols?: CalibrationSymbol[],
  calibrationDict?: CalibrationDictEntry[]
): DecodeResult {
  const symbols: string[] = [];
  let inStimulus = false;
  let currentFreq = 0;
  let spikeCount = 0;
  let stimStart = -1;

  // Build lookup from calibration dictionary
  const morseToChar: Record<string, string> = {};
  if (calibrationDict && calibrationDict.length > 0) {
    for (const entry of calibrationDict) {
      morseToChar[entry.morse_code] = entry.character;
    }
  } else {
    Object.assign(morseToChar, MORSE_DICT);
  }

  // Get calibration thresholds
  const dotCal = calibrationSymbols?.find((s) => s.character === "DOT");
  const dashCal = calibrationSymbols?.find((s) => s.character === "DASH");
  const useCalibration = !!(dotCal && dashCal);

  for (let i = 0; i < data.length; i++) {
    const pt = data[i];
    const isActive = pt.sound_freq_hz > 0;

    if (isActive && !inStimulus) {
      inStimulus = true;
      currentFreq = pt.sound_freq_hz;
      stimStart = pt.time_s;
      spikeCount = pt.od600 >= od600Threshold ? 1 : 0;
    } else if (isActive && inStimulus) {
      if (pt.od600 >= od600Threshold) spikeCount++;
    } else if (!isActive && inStimulus) {
      if (spikeCount > 0) {
        if (useCalibration) {
          const duration = pt.time_s - stimStart;
          if (duration >= dotCal!.min_duration_s && duration <= dotCal!.max_duration_s) {
            symbols.push("·");
          } else if (duration >= dashCal!.min_duration_s && duration <= dashCal!.max_duration_s) {
            symbols.push("−");
          } else {
            // Fallback to frequency-based
            symbols.push(currentFreq <= 500 ? "·" : "−");
          }
        } else {
          symbols.push(currentFreq <= 500 ? "·" : "−");
        }
      } else {
        symbols.push(" ");
      }
      inStimulus = false;
      spikeCount = 0;
    }
  }

  if (inStimulus && spikeCount > 0) {
    if (useCalibration) {
      const duration = (data[data.length - 1]?.time_s ?? 0) - stimStart;
      if (duration >= dotCal!.min_duration_s && duration <= dotCal!.max_duration_s) {
        symbols.push("·");
      } else {
        symbols.push("−");
      }
    } else {
      symbols.push(currentFreq <= 500 ? "·" : "−");
    }
  }

  // Group symbols into letters (split by spaces)
  const letters: { char: string; morse: string }[] = [];
  let currentMorse = "";
  for (const sym of symbols) {
    if (sym === " ") {
      if (currentMorse) {
        const morseKey = currentMorse.replace(/·/g, ".").replace(/−/g, "-");
        letters.push({ char: morseToChar[morseKey] || "?", morse: currentMorse });
        currentMorse = "";
      }
    } else {
      currentMorse += sym;
    }
  }
  if (currentMorse) {
    const morseKey = currentMorse.replace(/·/g, ".").replace(/−/g, "-");
    letters.push({ char: morseToChar[morseKey] || "?", morse: currentMorse });
  }

  return { symbols, decoded: symbols.join(""), letters };
}
