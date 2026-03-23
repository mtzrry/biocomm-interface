import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Upload, Download, Activity, Droplets, Eye, FileUp, Volume2, VolumeX } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Legend
} from "recharts";
import {
  parseCsvToSignalData, parseScientificCsv, isScientificCsv,
  decodeBioSignal, type CsvSignalPoint, type ScientificCsvPoint, type DecodeResult
} from "@/lib/csv-parser";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCalibration } from "@/contexts/CalibrationContext";
import { useSensoryFeedback } from "@/hooks/useSensoryFeedback";

interface Props {
  researcherName: string;
  institution: string;
}

const TARGET_WORD = "UNDIP";
const THRESHOLD = 0.6;

const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
};

function generateSignalPoint(tick: number) {
  const base = Math.sin(tick * 0.15) * 0.3 + 0.5;
  const noise = (Math.random() - 0.5) * 0.15;
  return Math.max(0, Math.min(1, base + noise));
}

export default function DecoderView({ researcherName, institution }: Props) {
  const { t } = useLanguage();
  const calibration = useCalibration();
  const [sensoryEnabled, setSensoryEnabled] = useState(true);
  const { playBeep } = useSensoryFeedback(sensoryEnabled);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<CsvSignalPoint[]>([]);
  const [sciData, setSciData] = useState<ScientificCsvPoint[]>([]);
  const [isScientific, setIsScientific] = useState(false);
  const [decodedChars, setDecodedChars] = useState<string[]>([]);
  const [decodeResult, setDecodeResult] = useState<DecodeResult | null>(null);
  const [logs, setLogs] = useState<string[]>([t("logInit"), t("logAwaiting")]);
  const [targetSeq, setTargetSeq] = useState(TARGET_WORD);
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [csvFileName, setCsvFileName] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevDecodedLen = useRef(0);

  const ph = (7.2 - tick * 0.003).toFixed(2);
  const od600 = (0.05 + tick * 0.004).toFixed(3);
  const colorIntensity = Math.min(100, tick * 0.8).toFixed(1);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-50), msg]);
  }, []);

  // Sensory feedback on new decoded symbols
  useEffect(() => {
    if (isScientific && decodeResult) {
      const newLen = decodeResult.symbols.length;
      if (newLen > prevDecodedLen.current) {
        const lastSym = decodeResult.symbols[newLen - 1];
        if (lastSym === "·") playBeep("dot");
        else if (lastSym === "−") playBeep("dash");
      }
      prevDecodedLen.current = newLen;
    } else if (!isScientific) {
      const newLen = decodedChars.length;
      if (newLen > prevDecodedLen.current) {
        playBeep("dot"); // simulation mode beep
      }
      prevDecodedLen.current = newLen;
    }
  }, [decodeResult, decodedChars, isScientific, playBeep]);

  const stimulusAreas = useCallback(() => {
    if (!isScientific || sciData.length === 0) return [];
    const areas: { x1: number; x2: number; freq: number }[] = [];
    let start: number | null = null;
    let freq = 0;

    for (let i = 0; i < sciData.length; i++) {
      const pt = sciData[i];
      if (pt.sound_freq_hz > 0 && start === null) {
        start = pt.time_s;
        freq = pt.sound_freq_hz;
      } else if ((pt.sound_freq_hz === 0 || i === sciData.length - 1) && start !== null) {
        areas.push({ x1: start, x2: pt.time_s, freq });
        start = null;
      }
    }
    return areas;
  }, [isScientific, sciData]);

  const handleCsvUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;

        if (isScientificCsv(text)) {
          const parsed = parseScientificCsv(text);
          if (parsed.length === 0) {
            addLog("[ERR] Scientific CSV parsing failed — check header format.");
            return;
          }
          setSciData(parsed);
          setData([]);
          setIsScientific(true);
          setCsvLoaded(true);
          setCsvFileName(file.name);
          setRunning(false);
          setTick(parsed.length);

          const result = decodeBioSignal(
            parsed, 0.3,
            calibration.loaded ? calibration.symbols : undefined,
            calibration.loaded ? calibration.dictionary : undefined
          );
          setDecodeResult(result);
          setDecodedChars(result.symbols);

          addLog(`[CSV] Scientific format detected: "${file.name}" — ${parsed.length} points.`);
          addLog(`[CSV] pH range: ${Math.min(...parsed.map((d) => d.ph_level)).toFixed(2)} – ${Math.max(...parsed.map((d) => d.ph_level)).toFixed(2)}`);
          addLog(`[CSV] OD600 range: ${Math.min(...parsed.map((d) => d.od600)).toFixed(3)} – ${Math.max(...parsed.map((d) => d.od600)).toFixed(3)}`);
          addLog(`[DEC] Morse decode: ${result.decoded || "(no signal detected)"}`);
          if (result.letters.length > 0) {
            addLog(`[DEC] Letters: ${result.letters.map((l) => l.char).join(" ")}`);
          }
          if (calibration.loaded) {
            addLog(`[CAL] Using calibration model: ${calibration.fileName}`);
          }
          const stimCount = parsed.filter((p) => p.sound_freq_hz > 0).length;
          addLog(`[SIG] Stimulus periods: ${stimCount} active samples`);
        } else {
          const parsed = parseCsvToSignalData(text, THRESHOLD);
          if (parsed.length === 0) {
            addLog("[ERR] CSV parsing failed — no valid signal data found.");
            return;
          }
          setData(parsed);
          setSciData([]);
          setIsScientific(false);
          setCsvLoaded(true);
          setCsvFileName(file.name);
          setRunning(false);
          setTick(parsed.length);
          setDecodeResult(null);
          addLog(`[CSV] Legacy format loaded: "${file.name}" — ${parsed.length} data points.`);
          addLog(`[CSV] Signal range: ${Math.min(...parsed.map((d) => d.signal)).toFixed(3)} – ${Math.max(...parsed.map((d) => d.signal)).toFixed(3)}`);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [addLog, calibration]
  );

  useEffect(() => {
    if (!running || csvLoaded) return;
    const interval = setInterval(() => {
      setTick((t) => {
        const next = t + 1;
        const signal = generateSignalPoint(next);
        setData((prev) => [...prev.slice(-60), { t: next, signal, threshold: THRESHOLD }]);

        if (next % 20 === 0 && decodedChars.length < targetSeq.length) {
          const charIdx = decodedChars.length;
          const char = targetSeq[charIdx] || "?";
          setDecodedChars((prev) => [...prev, char]);
          addLog(`[DEC] Symbol decoded: '${char}' (confidence: ${(0.85 + Math.random() * 0.14).toFixed(2)})`);
        }

        if (next % 8 === 0) {
          addLog(`[SIG] t=${next} | val=${signal.toFixed(3)} | ${signal >= THRESHOLD ? "HIGH ●" : "LOW ○"}`);
        }
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [running, csvLoaded, decodedChars.length, targetSeq, addLog]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const handleStart = () => {
    if (csvLoaded) {
      addLog(t("logCsvLoaded"));
      return;
    }
    setRunning(true);
    addLog(t("logStarted"));
  };
  const handlePause = () => {
    setRunning(false);
    addLog(t("logPaused"));
  };
  const handleReset = () => {
    setRunning(false);
    setTick(0);
    setData([]);
    setSciData([]);
    setIsScientific(false);
    setDecodedChars([]);
    setDecodeResult(null);
    setCsvLoaded(false);
    setCsvFileName("");
    prevDecodedLen.current = 0;
    setLogs([t("logReset"), t("logAwaiting")]);
  };

  const timeline = isScientific
    ? sciData.slice(-40).map((d) => ({ val: d.od600, high: d.od600 >= 0.3, t: d.time_s }))
    : data.slice(-40).map((d) => ({ val: d.signal, high: d.signal >= THRESHOLD, t: d.t }));

  const areas = stimulusAreas();

  const displayPh = isScientific && sciData.length > 0 ? sciData[sciData.length - 1].ph_level.toFixed(2) : ph;
  const displayOd = isScientific && sciData.length > 0 ? sciData[sciData.length - 1].od600.toFixed(3) : od600;
  const displayColor = isScientific && sciData.length > 0 ? sciData[sciData.length - 1].color_intensity.toFixed(1) : colorIntensity;

  // Build dual output (letter + morse) for display
  const dualOutput = isScientific && decodeResult
    ? decodeResult.letters
    : decodedChars.map((ch) => ({ char: ch, morse: MORSE_MAP[ch] || "?" }));

  return (
    <div className="min-h-screen pt-20 pb-10 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{t("decoderDashboard")}</h2>
            <p className="text-xs text-muted-foreground font-mono-sci">BIO-DIGITAL TRANSDUCER v2.0</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sensory toggle */}
            <button
              onClick={() => setSensoryEnabled(!sensoryEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                sensoryEnabled
                  ? "border-primary/30 text-primary bg-primary/10"
                  : "border-border text-muted-foreground"
              }`}
              title={t("sensoryFeedback")}
            >
              {sensoryEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {t("sensoryFeedback")}: {sensoryEnabled ? t("sensoryOn") : t("sensoryOff")}
            </button>
            {csvLoaded && (
              <div className="glass-panel rounded-full px-3 py-1.5 text-xs font-mono-sci text-accent">
                <FileUp className="w-3 h-3 inline mr-1" />
                {csvFileName}{isScientific ? " (Scientific)" : " (Legacy)"}
              </div>
            )}
            {researcherName && (
              <div className="glass-panel rounded-full px-4 py-1.5 text-xs font-mono-sci text-primary">
                <Activity className="w-3 h-3 inline mr-1" />
                {researcherName}{institution ? ` · ${institution}` : ""}
              </div>
            )}
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 settings-gap">
          {/* Left column */}
          <div className="lg:col-span-8 space-y-4">
            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: t("phLevel"), value: displayPh, icon: Droplets, color: "text-primary" },
                { label: t("od600"), value: displayOd, icon: Activity, color: "text-teal-600" },
                { label: t("colorIntensity"), value: `${displayColor}%`, icon: Eye, color: "text-emerald-500" },
              ].map((m) => (
                <div key={m.label} className="glass-panel-strong rounded-xl settings-panel-padding">
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                  </div>
                  <p className="text-2xl font-bold font-mono-sci text-foreground">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="glass-panel-strong rounded-xl settings-panel-padding">
              <p className="text-xs text-muted-foreground mb-3 font-mono-sci">
                {isScientific ? `Multi-metric Chart — ${sciData.length} pts` : csvLoaded ? `Signal Curve — CSV (${data.length} pts)` : `Signal Curve — ${t("simulationMode")}`}
              </p>
              <div className="h-52 md:h-64 settings-chart-height">
                <ResponsiveContainer width="100%" height="100%">
                  {isScientific ? (
                    <LineChart data={sciData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time_s" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" label={{ value: "Time (s)", position: "insideBottom", offset: -2, fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      {areas.map((a, i) => (
                        <ReferenceArea
                          key={i}
                          x1={a.x1}
                          x2={a.x2}
                          fill={a.freq <= 500 ? "hsl(160 84% 39% / 0.12)" : "hsl(190 90% 50% / 0.12)"}
                          strokeOpacity={0}
                        />
                      ))}
                      <Line type="monotone" dataKey="ph_level" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={sciData.length < 80} name="pH" />
                      <Line type="monotone" dataKey="od600" stroke="hsl(174, 84%, 24%)" strokeWidth={2} dot={sciData.length < 80} name="OD600" />
                      <Line type="monotone" dataKey="color_intensity" stroke="hsl(45, 90%, 55%)" strokeWidth={1.5} dot={false} name="Color %" />
                    </LineChart>
                  ) : (
                    <LineChart data={csvLoaded ? data : data.slice(-60)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="signal" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={csvLoaded && data.length < 100} />
                      <ReferenceLine y={THRESHOLD} stroke="hsl(190, 90%, 50%)" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: "Threshold", fill: "hsl(190, 90%, 50%)", fontSize: 10 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeline raster */}
            <div className="glass-panel-strong rounded-xl settings-panel-padding">
              <p className="text-xs text-muted-foreground mb-2 font-mono-sci">
                {isScientific ? t("od600Timeline") : t("signalTimeline")}
              </p>
              <div className="flex gap-0.5 overflow-x-auto">
                {timeline.map((d, i) => (
                  <div
                    key={i}
                    className={`w-3 h-6 rounded-sm flex-shrink-0 transition-colors ${d.high ? "bg-primary" : "bg-muted"}`}
                    title={`t=${d.t} val=${d.val.toFixed(3)}`}
                  />
                ))}
              </div>
            </div>

            {/* Dual Decoded Output */}
            <div className="glass-panel-strong rounded-xl p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1 font-mono-sci">
                {t("decodedResultLabel")}
              </p>
              {calibration.loaded && (
                <p className="text-[10px] text-accent mb-2 font-mono-sci">
                  🔬 {t("calibrationLoaded")}: {calibration.fileName}
                </p>
              )}
              <div className="flex justify-center gap-2 flex-wrap mb-3">
                {dualOutput.length > 0 ? dualOutput.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex flex-col items-center"
                  >
                    <span className="w-12 h-14 flex items-center justify-center rounded-lg border border-border text-xl font-bold font-mono-sci text-foreground bg-muted/50">
                      {item.char}
                    </span>
                    <span className="text-[10px] font-mono-sci text-accent mt-1 tracking-wider">
                      {item.morse}
                    </span>
                  </motion.div>
                )) : (
                  <span className="text-muted-foreground text-sm font-mono-sci">
                    {isScientific ? t("noStimulus") : "—"}
                  </span>
                )}
              </div>
              {dualOutput.length > 0 && (
                <p className="text-[10px] text-muted-foreground font-mono-sci">
                  {t("morseRepresentation")}: {dualOutput.map((d) => d.morse).join(" | ")}
                </p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-4">
            {/* Terminal */}
            <div className="terminal-panel rounded-xl p-4 h-72 lg:h-96 flex flex-col">
              <p className="text-xs opacity-60 mb-2">// {t("systemLog").toUpperCase()}</p>
              <div ref={logRef} className="flex-1 overflow-y-auto text-xs leading-relaxed space-y-0.5 scrollbar-thin">
                {logs.map((l, i) => (
                  <div key={i} className={l.startsWith("[CSV]") ? "text-emerald-400" : l.startsWith("[ERR]") ? "text-red-400" : l.startsWith("[DEC]") ? "text-cyan-400" : l.startsWith("[CAL]") ? "text-yellow-400" : "opacity-80"}>
                    {l}
                  </div>
                ))}
                {running && <span className="animate-pulse-glow">▌</span>}
              </div>
            </div>

            {/* Controls */}
            <div className="glass-panel-strong rounded-xl settings-panel-padding space-y-3">
              {!isScientific && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-mono-sci">{t("targetSequence")}</label>
                  <input
                    value={targetSeq}
                    onChange={(e) => setTargetSeq(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono-sci focus:outline-none focus:ring-2 focus:ring-primary/40"
                    disabled={running}
                  />
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleStart} disabled={running} className="flex items-center justify-center gap-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 glow-btn">
                  <Play className="w-3 h-3" /> {t("start")}
                </button>
                <button onClick={handlePause} disabled={!running} className="flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-foreground text-xs font-medium disabled:opacity-40 hover:bg-muted transition-colors">
                  <Pause className="w-3 h-3" /> {t("pause")}
                </button>
                <button onClick={handleReset} className="flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors">
                  <RotateCcw className="w-3 h-3" /> {t("reset")}
                </button>
              </div>

              {/* CSV Upload */}
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-primary/40 text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {csvLoaded ? t("replaceCsv") : t("uploadCsv")}
                </button>
                <button
                  onClick={() => {
                    const sample = "time_s,sound_freq_hz,ph_level,od600,color_intensity\n0,0,7.20,0.050,2.0\n5,0,7.18,0.055,3.1\n10,100,7.15,0.120,8.5\n15,100,7.12,0.310,15.2\n20,100,7.10,0.450,22.8\n25,0,7.08,0.200,18.0\n30,0,7.06,0.150,14.5\n35,10000,7.03,0.380,25.0\n40,10000,7.00,0.520,32.1\n45,10000,6.97,0.610,38.5\n50,10000,6.95,0.580,35.0\n55,0,6.93,0.280,20.0\n60,0,6.91,0.180,15.2\n65,100,6.89,0.350,28.0\n70,100,6.87,0.420,31.5\n75,0,6.85,0.160,12.0\n80,0,6.83,0.100,8.5\n85,10000,6.81,0.490,34.0\n90,10000,6.79,0.560,37.8\n95,0,6.77,0.140,10.2\n100,0,6.75,0.080,5.0";
                    const blob = new Blob([sample], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "sample_scientific_data.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                    addLog(t("logSampleDownloaded"));
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t("sampleCsv")}
                </button>
              </div>
              <p className="text-xs text-muted-foreground font-mono-sci text-center">
                {t("csvFormat")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
