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

/** Scientific parser for Harris et al. 2021 format:
 *  time_s,sound_freq_hz,ph_level,od600,color_intensity */
export function parseScientificCsv(csvText: string): ScientificCsvPoint[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());

  const colMap: Record<string, number> = {};
  const requiredCols = ["time_s", "sound_freq_hz", "ph_level", "od600", "color_intensity"];

  for (const col of requiredCols) {
    const idx = header.indexOf(col);
    if (idx === -1) return []; // strict: all columns required
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

/** Decode bio-signal from scientific data using OD600 spikes during sound stimuli.
 *  100 Hz → DOT, 10000 Hz → DASH. Groups decoded via Morse-like mapping. */
export function decodeBioSignal(
  data: ScientificCsvPoint[],
  od600Threshold: number = 0.3
): { symbols: string[]; decoded: string } {
  const symbols: string[] = [];
  let inStimulus = false;
  let currentFreq = 0;
  let spikeCount = 0;

  for (let i = 0; i < data.length; i++) {
    const pt = data[i];
    const isActive = pt.sound_freq_hz > 0;

    if (isActive && !inStimulus) {
      // Entering stimulus period
      inStimulus = true;
      currentFreq = pt.sound_freq_hz;
      spikeCount = pt.od600 >= od600Threshold ? 1 : 0;
    } else if (isActive && inStimulus) {
      if (pt.od600 >= od600Threshold) spikeCount++;
    } else if (!isActive && inStimulus) {
      // Exiting stimulus period — classify
      if (spikeCount > 0) {
        if (currentFreq <= 500) {
          symbols.push("·"); // DOT for low-frequency
        } else {
          symbols.push("−"); // DASH for high-frequency
        }
      } else {
        symbols.push(" "); // gap / no response
      }
      inStimulus = false;
      spikeCount = 0;
    }
  }

  // Handle case where data ends during stimulus
  if (inStimulus && spikeCount > 0) {
    symbols.push(currentFreq <= 500 ? "·" : "−");
  }

  return { symbols, decoded: symbols.join("") };
}
