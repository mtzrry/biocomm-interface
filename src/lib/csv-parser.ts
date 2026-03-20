export interface CsvSignalPoint {
  t: number;
  signal: number;
  threshold: number;
}

export function parseCsvToSignalData(
  csvText: string,
  threshold: number
): CsvSignalPoint[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());

  // Try to find signal column (signal, value, intensity, od, absorbance)
  const signalAliases = ["signal", "value", "intensity", "od", "absorbance", "od600", "fluorescence"];
  const timeAliases = ["t", "time", "tick", "sample", "index", "seconds", "minutes"];

  let signalIdx = header.findIndex((h) => signalAliases.includes(h));
  let timeIdx = header.findIndex((h) => timeAliases.includes(h));

  // Fallback: first numeric-looking columns
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
