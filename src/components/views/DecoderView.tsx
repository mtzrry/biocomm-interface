import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Play, Pause, RotateCcw, Upload, Download, Activity, Droplets, Eye,
  FileUp, Volume2, VolumeX, ChevronDown, CheckCircle2, FlaskConical, Trash2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Legend
} from "recharts";
import {
  parseScientificCsv, isScientificCsv,
  type ScientificCsvPoint
} from "@/lib/csv-parser";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCalibration, parseOrganismCsv, isOrganismCsv } from "@/contexts/CalibrationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useSensoryFeedback } from "@/hooks/useSensoryFeedback";
import { useToast } from "@/hooks/use-toast";

interface Props {
  researcherName: string;
  institution: string;
}

const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
};

const MORSE_TO_CHAR: Record<string, string> = {};
Object.entries(MORSE_MAP).forEach(([ch, morse]) => { MORSE_TO_CHAR[morse] = ch; });

const TRANSLATION_DICT: Record<string, string> = {
  UNDIP: "Universitas Diponegoro",
  HELLO: "Halo",
  SOS: "Tolong / Bahaya",
  TEST: "Uji Coba",
  BIO: "Biologi",
  RAGI: "Saccharomyces cerevisiae",
  NAWAAL: "Peneliti Utama",
};

type Speed = "slow" | "normal" | "fast";
const SPEED_MS: Record<Speed, number> = { slow: 500, normal: 200, fast: 100 };

type StreamStatus = "idle" | "streaming" | "complete";

const REQUIRED_HEADERS = ["time_s", "sound_freq_hz", "ph_level", "od600", "color_intensity"];

const STANDBY_DATA = Array.from({ length: 20 }, (_, i) => ({
  time_s: i * 5, ph_level: 7.0, od600: 0.3, color_intensity: 0, sound_freq_hz: 0,
}));

export default function DecoderView({ researcherName, institution }: Props) {
  const { t } = useLanguage();
  const calibration = useCalibration();
  const { accentTheme } = useSettings();
  const { toast } = useToast();
  const [sensoryEnabled, setSensoryEnabled] = useState(true);
  const { playBeep, speakText } = useSensoryFeedback(sensoryEnabled);

  // CSV data
  const [pendingData, setPendingData] = useState<ScientificCsvPoint[]>([]);
  const [activeData, setActiveData] = useState<ScientificCsvPoint[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvLoaded, setCsvLoaded] = useState(false);

  // Streaming
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const [speed, setSpeed] = useState<Speed>("normal");
  const [speedOpen, setSpeedOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickIndexRef = useRef(0);

  // Decode state
  const [decodedLetters, setDecodedLetters] = useState<{ char: string; morse: string }[]>([]);
  const [decodedWord, setDecodedWord] = useState("");
  const [translatedWord, setTranslatedWord] = useState("");
  const [manualText, setManualText] = useState("");
  const highCountRef = useRef(0);
  const lowCountRef = useRef(0);
  const morseBufferRef = useRef("");
  const wordBufferRef = useRef("");
  const lastSpokenRef = useRef("");

  // Logs
  const [logs, setLogs] = useState<string[]>([t("logInit"), t("logAwaiting")]);
  const logRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const calFileInputRef = useRef<HTMLInputElement>(null);

  // Accent-aware chart colors
  const chartColors = {
    emerald: { line1: "hsl(160, 84%, 39%)", line2: "hsl(174, 84%, 24%)", shade1: "hsl(160 84% 39% / 0.12)", shade2: "hsl(190 90% 50% / 0.12)" },
    blue: { line1: "hsl(217, 91%, 60%)", line2: "hsl(213, 94%, 48%)", shade1: "hsl(217 91% 60% / 0.12)", shade2: "hsl(200 90% 50% / 0.12)" },
    rose: { line1: "hsl(346, 77%, 58%)", line2: "hsl(340, 65%, 47%)", shade1: "hsl(346 77% 58% / 0.12)", shade2: "hsl(320 70% 50% / 0.12)" },
  }[accentTheme];

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-80), msg]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const stimulusAreas = useCallback(() => {
    if (activeData.length === 0) return [];
    const areas: { x1: number; x2: number; freq: number }[] = [];
    let start: number | null = null;
    let freq = 0;
    for (let i = 0; i < activeData.length; i++) {
      const pt = activeData[i];
      if (pt.sound_freq_hz > 0 && start === null) {
        start = pt.time_s; freq = pt.sound_freq_hz;
      } else if ((pt.sound_freq_hz === 0 || i === activeData.length - 1) && start !== null) {
        areas.push({ x1: start, x2: pt.time_s, freq }); start = null;
      }
    }
    return areas;
  }, [activeData]);

  // === RESET ===
  const handleReset = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    tickIndexRef.current = 0;
    highCountRef.current = 0;
    lowCountRef.current = 0;
    morseBufferRef.current = "";
    wordBufferRef.current = "";
    lastSpokenRef.current = "";
    setActiveData([]);
    setDecodedLetters([]);
    setDecodedWord("");
    setTranslatedWord("");
    setStreamStatus("idle");
    setPendingData([]);
    setCsvLoaded(false);
    setCsvFileName("");
    setLogs([t("logReset"), t("logAwaiting")]);
  }, [t]);

  // === STRICT SENSOR CSV VALIDATION ===
  const validateCsvHeaders = (text: string): boolean => {
    const firstLine = text.trim().split("\n")[0]?.toLowerCase() || "";
    const headers = firstLine.split(",").map((h) => h.trim());
    return REQUIRED_HEADERS.every((h) => headers.includes(h));
  };

  const handleCsvUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (!validateCsvHeaders(text)) {
          toast({ variant: "destructive", title: "CSV Format Error", description: `Header harus: ${REQUIRED_HEADERS.join(", ")}`, duration: 5000 });
          addLog("[ERR] CSV rejected — invalid headers.");
          return;
        }
        if (!isScientificCsv(text)) {
          toast({ variant: "destructive", title: "CSV Format Error", description: "File harus menggunakan format scientific.", duration: 5000 });
          addLog("[ERR] CSV rejected — not in scientific format.");
          return;
        }
        const parsed = parseScientificCsv(text);
        if (parsed.length === 0) {
          toast({ variant: "destructive", title: "CSV Parse Error", description: "Tidak ada data valid ditemukan.", duration: 5000 });
          return;
        }
        handleReset();
        setPendingData(parsed);
        setCsvLoaded(true);
        setCsvFileName(file.name);
        addLog(`[CSV] Loaded "${file.name}" — ${parsed.length} data points.`);
        if (calibration.loaded) addLog(`[CAL] Using profile: ${calibration.profile.organism_name}`);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [addLog, calibration, toast, handleReset]
  );

  // === ORGANISM CALIBRATION CSV UPLOAD (with mid-stream reset) ===
  const handleCalibrationUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (!isOrganismCsv(text)) {
          toast({ variant: "destructive", title: t("invalidOrganismFormat"), description: "Header: organism_name, type, baseline_ph, baseline_od, threshold_od", duration: 5000 });
          addLog("[ERR] Organism CSV rejected — invalid format.");
          return;
        }
        const profile = parseOrganismCsv(text);
        if (!profile) {
          toast({ variant: "destructive", title: t("invalidOrganismFormat"), description: "Data tidak dapat diparsing.", duration: 5000 });
          return;
        }
        // Mid-stream reset safety
        if (streamStatus === "streaming" || (streamStatus === "idle" && activeData.length > 0)) {
          handleReset();
          addLog("[SYS] Auto-RESET triggered — new organism profile loaded mid-stream.");
        }
        calibration.setProfile(profile, file.name);
        toast({ title: `✓ ${profile.organism_name}`, description: `Baseline OD: ${profile.baseline_od} | pH: ${profile.baseline_ph} | Threshold: ${profile.threshold_od}`, duration: 4000 });
        addLog(`[CAL] Organism profile loaded: ${profile.organism_name} (${file.name})`);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [addLog, calibration, toast, t, streamStatus, activeData.length, handleReset]
  );

  // === STREAMING ENGINE (DO NOT MODIFY TTS / GAP LOGIC) ===
  const processTickDecode = useCallback((pt: ScientificCsvPoint) => {
    const threshold = calibration.profile.threshold_od;
    const isHigh = pt.sound_freq_hz > 0 || pt.od600 > threshold;

    if (isHigh) {
      highCountRef.current++;
      if (lowCountRef.current > 0) {
        const lowTicks = lowCountRef.current;
        if (lowTicks >= 3 && lowTicks <= 5 && morseBufferRef.current) {
          const char = MORSE_TO_CHAR[morseBufferRef.current] || "?";
          const morse = morseBufferRef.current;
          setDecodedLetters((prev) => [...prev, { char, morse }]);
          wordBufferRef.current += char;
          addLog(`[DEC] Letter: '${char}' (${morse})`);
          if (char !== "?") playBeep("dot");
          morseBufferRef.current = "";
        } else if (lowTicks > 5 && morseBufferRef.current) {
          const char = MORSE_TO_CHAR[morseBufferRef.current] || "?";
          const morse = morseBufferRef.current;
          setDecodedLetters((prev) => [...prev, { char, morse }]);
          wordBufferRef.current += char;
          morseBufferRef.current = "";
          const word = wordBufferRef.current;
          if (word) {
            setDecodedWord(word);
            const translated = TRANSLATION_DICT[word] || "";
            if (translated) setTranslatedWord(translated);
            addLog(`[DEC] Word: "${word}"${translated ? ` → "${translated}"` : ""}`);
            if (sensoryEnabled && word !== lastSpokenRef.current) {
              speakText(word); lastSpokenRef.current = word;
            }
          }
          wordBufferRef.current = "";
          setDecodedLetters((prev) => [...prev, { char: " ", morse: "" }]);
        } else if (lowTicks > 5) {
          const word = wordBufferRef.current;
          if (word) {
            setDecodedWord(word);
            const translated = TRANSLATION_DICT[word] || "";
            if (translated) setTranslatedWord(translated);
            addLog(`[DEC] Word: "${word}"${translated ? ` → "${translated}"` : ""}`);
            if (sensoryEnabled && word !== lastSpokenRef.current) {
              speakText(word); lastSpokenRef.current = word;
            }
          }
          wordBufferRef.current = "";
        }
        lowCountRef.current = 0;
      }
    } else {
      if (highCountRef.current > 0) {
        if (highCountRef.current >= 1 && highCountRef.current <= 2) {
          morseBufferRef.current += ".";
          addLog(`[SIG] DOT detected (${highCountRef.current} ticks)`);
          playBeep("dot");
        } else if (highCountRef.current >= 3) {
          morseBufferRef.current += "-";
          addLog(`[SIG] DASH detected (${highCountRef.current} ticks)`);
          playBeep("dash");
        }
        highCountRef.current = 0;
      }
      lowCountRef.current++;
    }
  }, [addLog, playBeep, speakText, sensoryEnabled, calibration.profile.threshold_od]);

  const handleStart = useCallback(() => {
    if (!csvLoaded || pendingData.length === 0) {
      toast({ description: t("uploadCsv"), duration: 3000 });
      return;
    }
    if (streamStatus === "complete") return;
    setStreamStatus("streaming");
    addLog(`[SYS] Streaming STARTED (${speed} — ${SPEED_MS[speed]}ms/tick)`);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const idx = tickIndexRef.current;
      if (idx >= pendingData.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (morseBufferRef.current) {
          const char = MORSE_TO_CHAR[morseBufferRef.current] || "?";
          setDecodedLetters((prev) => [...prev, { char, morse: morseBufferRef.current }]);
          wordBufferRef.current += char;
          morseBufferRef.current = "";
        }
        if (wordBufferRef.current) {
          const word = wordBufferRef.current;
          setDecodedWord(word);
          const translated = TRANSLATION_DICT[word] || "";
          if (translated) setTranslatedWord(translated);
          wordBufferRef.current = "";
          if (sensoryEnabled && word !== lastSpokenRef.current) {
            speakText(word); lastSpokenRef.current = word;
          }
        }
        setStreamStatus("complete");
        addLog("[SYS] ✓ STREAM COMPLETE — SELESAI");
        return;
      }
      const pt = pendingData[idx];
      setActiveData((prev) => [...prev, pt]);
      processTickDecode(pt);
      if (idx % 5 === 0) {
        addLog(`[SIG] t=${pt.time_s}s | freq=${pt.sound_freq_hz}Hz | od=${pt.od600.toFixed(3)} | pH=${pt.ph_level.toFixed(2)}`);
      }
      tickIndexRef.current = idx + 1;
    }, SPEED_MS[speed]);
  }, [csvLoaded, pendingData, streamStatus, speed, addLog, processTickDecode, toast, t, sensoryEnabled, speakText]);

  const handlePause = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamStatus === "streaming") { setStreamStatus("idle"); addLog(t("logPaused")); }
  }, [streamStatus, addLog, t]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const chartData = activeData.length > 0 ? activeData : STANDBY_DATA;
  const areas = stimulusAreas();
  const lastPt = activeData.length > 0 ? activeData[activeData.length - 1] : null;
  const displayPh = lastPt ? lastPt.ph_level.toFixed(2) : calibration.profile.baseline_ph.toFixed(2);
  const displayOd = lastPt ? lastPt.od600.toFixed(3) : calibration.profile.baseline_od.toFixed(3);
  const displayColor = lastPt ? lastPt.color_intensity.toFixed(1) : "0.0";
  const timeline = activeData.slice(-40).map((d) => ({
    val: d.od600, high: d.od600 >= calibration.profile.threshold_od, t: d.time_s
  }));
  const dualOutput = decodedLetters.filter((l) => l.char !== " ");

  return (
    <div className="min-h-screen pt-20 pb-10 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{t("decoderDashboard")}</h2>
            <p className="text-xs text-muted-foreground font-mono-sci">MICORSE v1.1 — Microorganism Morse Code Biotranslator</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {streamStatus === "streaming" && (
              <div className="rounded-full px-3 py-1.5 text-xs font-mono-sci font-bold bg-primary/20 text-primary border border-primary/30 animate-pulse">● STREAMING</div>
            )}
            {streamStatus === "complete" && (
              <div className="rounded-full px-3 py-1.5 text-xs font-mono-sci font-bold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> SELESAI / COMPLETE
              </div>
            )}
            <button
              onClick={() => setSensoryEnabled(!sensoryEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                sensoryEnabled ? "border-primary/30 text-primary bg-primary/10" : "border-border text-muted-foreground"
              }`}
            >
              {sensoryEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              Audio: {sensoryEnabled ? "ON" : "OFF"}
            </button>
            {csvLoaded && (
              <div className="glass-panel rounded-full px-3 py-1.5 text-xs font-mono-sci text-accent">
                <FileUp className="w-3 h-3 inline mr-1" />{csvFileName}
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
                { label: t("od600"), value: displayOd, icon: Activity, color: "text-secondary" },
                { label: t("colorIntensity"), value: `${displayColor}%`, icon: Eye, color: "text-accent" },
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
                {csvLoaded ? `Multi-metric Chart — ${activeData.length}/${pendingData.length} pts` : "Standby Baseline — Upload CSV to begin"}
              </p>
              <div className="h-52 md:h-64 settings-chart-height">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time_s" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" label={{ value: "Time (s)", position: "insideBottom", offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <ReferenceLine y={calibration.profile.baseline_od} stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: `OD Baseline (${calibration.profile.baseline_od})`, fill: "#94a3b8", fontSize: 9, position: "right" }} />
                    <ReferenceLine y={calibration.profile.baseline_ph} stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} label={{ value: `pH Baseline (${calibration.profile.baseline_ph})`, fill: "#94a3b8", fontSize: 9, position: "left" }} />
                    {areas.map((a, i) => (
                      <ReferenceArea key={i} x1={a.x1} x2={a.x2} fill={a.freq <= 500 ? chartColors.shade1 : chartColors.shade2} strokeOpacity={0} />
                    ))}
                    <Line type="monotone" dataKey="ph_level" stroke={chartColors.line1} strokeWidth={2} dot={chartData.length < 80} name="pH" />
                    <Line type="monotone" dataKey="od600" stroke={chartColors.line2} strokeWidth={2} dot={chartData.length < 80} name="OD600" />
                    <Line type="monotone" dataKey="color_intensity" stroke="hsl(45, 90%, 55%)" strokeWidth={1.5} dot={false} name="Color %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeline raster */}
            <div className="glass-panel-strong rounded-xl settings-panel-padding">
              <p className="text-xs text-muted-foreground mb-2 font-mono-sci">{t("od600Timeline")}</p>
              <div className="flex gap-0.5 overflow-x-auto">
                {timeline.length > 0 ? timeline.map((d, i) => (
                  <div key={i} className={`w-3 h-6 rounded-sm flex-shrink-0 transition-colors ${d.high ? "bg-primary" : "bg-muted"}`} title={`t=${d.t}s val=${d.val.toFixed(3)}`} />
                )) : (
                  <span className="text-xs text-muted-foreground font-mono-sci">— Awaiting data —</span>
                )}
              </div>
            </div>

            {/* Dual Decoded Output */}
            <div className="glass-panel-strong rounded-xl p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1 font-mono-sci">Hasil Dekode Akhir</p>
              {calibration.loaded && (
                <p className="text-[10px] text-accent mb-2 font-mono-sci">🔬 {calibration.profile.organism_name} — {calibration.fileName}</p>
              )}
              <div className="flex justify-center gap-2 flex-wrap mb-3">
                {dualOutput.length > 0 ? dualOutput.map((item, i) => (
                  <motion.div key={i} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.06 }} className="flex flex-col items-center">
                    <span className="w-12 h-14 flex items-center justify-center rounded-lg border border-border text-xl font-bold font-mono-sci text-foreground bg-muted/50">{item.char}</span>
                    <span className="text-[10px] font-mono-sci text-accent mt-1 tracking-wider">{item.morse}</span>
                  </motion.div>
                )) : (
                  <span className="text-muted-foreground text-sm font-mono-sci">—</span>
                )}
              </div>
              {decodedWord && <p className="text-sm font-bold font-mono-sci text-primary mb-1">{decodedWord}</p>}
              {translatedWord && <p className="text-xs text-accent font-mono-sci">→ {translatedWord}</p>}
              {dualOutput.length > 0 && (
                <p className="text-[10px] text-muted-foreground font-mono-sci mt-2">Representasi Sandi Morse: {dualOutput.map((d) => d.morse).join(" | ")}</p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-4">
            {/* Terminal */}
            <div className="terminal-panel rounded-xl p-4 h-56 lg:h-72 flex flex-col">
              <p className="text-xs opacity-60 mb-2">// {t("systemLog").toUpperCase()}</p>
              <div ref={logRef} className="flex-1 overflow-y-auto text-xs leading-relaxed space-y-0.5 scrollbar-thin">
                {logs.map((l, i) => (
                  <div key={i} className={
                    l.startsWith("[CSV]") ? "text-emerald-400" :
                    l.startsWith("[ERR]") ? "text-red-400" :
                    l.startsWith("[DEC]") ? "text-cyan-400" :
                    l.startsWith("[CAL]") ? "text-yellow-400" :
                    l.startsWith("[SIG]") ? "text-teal-300" :
                    l.includes("SELESAI") ? "text-emerald-300 font-bold" :
                    "opacity-80"
                  }>{l}</div>
                ))}
                {streamStatus === "streaming" && <span className="animate-pulse-glow">▌</span>}
              </div>
            </div>

            {/* SECTION A: Setup Organisme */}
            <div className="glass-panel-strong rounded-xl settings-panel-padding space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono-sci">{t("setupOrganism")}</h3>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono-sci">{t("setupOrganismDesc")}</p>

              {/* Bio Params */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground font-mono-sci block mb-1">{t("baselinePh")}</label>
                  <input
                    type="number" step="0.1" value={calibration.profile.baseline_ph}
                    onChange={(e) => calibration.updateParam("baseline_ph", parseFloat(e.target.value) || 7.0)}
                    className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-mono-sci text-center focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-mono-sci block mb-1">{t("baselineOd")}</label>
                  <input
                    type="number" step="0.01" value={calibration.profile.baseline_od}
                    onChange={(e) => calibration.updateParam("baseline_od", parseFloat(e.target.value) || 0.3)}
                    className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-mono-sci text-center focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-mono-sci block mb-1">{t("thresholdOd")}</label>
                  <input
                    type="number" step="0.01" value={calibration.profile.threshold_od}
                    onChange={(e) => calibration.updateParam("threshold_od", parseFloat(e.target.value) || 0.6)}
                    className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-mono-sci text-center focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Calibration CSV Upload */}
              <input ref={calFileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCalibrationUpload} />
              {calibration.loaded ? (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono-sci text-accent font-medium truncate max-w-[180px]">🔬 {calibration.profile.organism_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono-sci">{calibration.fileName}</p>
                  </div>
                  <button onClick={() => { calibration.clearProfile(); addLog(t("logCalibrationCleared")); }} className="text-destructive hover:text-destructive/80 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => calFileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-accent/40 text-accent text-xs font-medium hover:bg-accent/5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {t("uploadOrganismProfile")}
                </button>
              )}
              <p className="text-[10px] text-muted-foreground font-mono-sci text-center">{t("calibrationFormat")}</p>
            </div>

            {/* SECTION B: Simulasi Sinyal */}
            <div className="glass-panel-strong rounded-xl settings-panel-padding space-y-3 border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono-sci">{t("simulasiSinyal")}</h3>
              </div>

              {/* Speed selector */}
              <div className="relative">
                <label className="text-xs text-muted-foreground mb-1 block font-mono-sci">Speed</label>
                <button
                  onClick={() => setSpeedOpen(!speedOpen)}
                  disabled={streamStatus === "streaming"}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono-sci disabled:opacity-40"
                >
                  <span>{speed === "slow" ? "🐢 Slow (500ms)" : speed === "normal" ? "▶ Normal (200ms)" : "⚡ Fast (100ms)"}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {speedOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-20 glass-panel-strong rounded-lg border border-border overflow-hidden">
                    {(["slow", "normal", "fast"] as Speed[]).map((s) => (
                      <button key={s} onClick={() => { setSpeed(s); setSpeedOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs font-mono-sci hover:bg-muted transition-colors ${speed === s ? "bg-primary/10 text-primary" : "text-foreground"}`}>
                        {s === "slow" ? "🐢 Slow (500ms/tick)" : s === "normal" ? "▶ Normal (200ms/tick)" : "⚡ Fast (100ms/tick)"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleStart} disabled={streamStatus === "streaming" || streamStatus === "complete"}
                  className="flex items-center justify-center gap-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 glow-btn">
                  <Play className="w-3 h-3" /> {t("start")}
                </button>
                <button onClick={handlePause} disabled={streamStatus !== "streaming"}
                  className="flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-foreground text-xs font-medium disabled:opacity-40 hover:bg-muted transition-colors">
                  <Pause className="w-3 h-3" /> {t("pause")}
                </button>
                <button onClick={handleReset}
                  className="flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors">
                  <RotateCcw className="w-3 h-3" /> {t("reset")}
                </button>
              </div>

              {/* CSV Upload */}
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-primary/40 text-primary text-xs font-medium hover:bg-primary/5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {csvLoaded ? t("replaceCsv") : t("uploadCsv")}
                </button>
                <button
                  onClick={() => {
                    const sample = "time_s,sound_freq_hz,ph_level,od600,color_intensity\n0,0,7.20,0.050,2.0\n5,0,7.18,0.055,3.1\n10,100,7.15,0.120,8.5\n15,100,7.12,0.310,15.2\n20,100,7.10,0.450,22.8\n25,0,7.08,0.200,18.0\n30,0,7.06,0.150,14.5\n35,10000,7.03,0.380,25.0\n40,10000,7.00,0.520,32.1\n45,10000,6.97,0.610,38.5\n50,10000,6.95,0.580,35.0\n55,0,6.93,0.280,20.0\n60,0,6.91,0.180,15.2\n65,100,6.89,0.350,28.0\n70,100,6.87,0.420,31.5\n75,0,6.85,0.160,12.0\n80,0,6.83,0.100,8.5\n85,10000,6.81,0.490,34.0\n90,10000,6.79,0.560,37.8\n95,0,6.77,0.140,10.2\n100,0,6.75,0.080,5.0";
                    const blob = new Blob([sample], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = "sample_micorse_data.csv"; a.click();
                    URL.revokeObjectURL(url);
                    addLog(t("logSampleDownloaded"));
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:bg-muted transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  {t("sampleCsv")}
                </button>
              </div>
              <p className="text-xs text-muted-foreground font-mono-sci text-center">{t("csvFormat")}</p>

              {/* Manual Simulator */}
              <div className="border-t border-border pt-3 mt-1 space-y-2">
                <label className="text-xs text-muted-foreground font-mono-sci block">Simulasi Manual</label>
                <input
                  type="text" value={manualText}
                  onChange={(e) => setManualText(e.target.value.toUpperCase())}
                  placeholder="Ketik teks manual (contoh: RAGI)"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono-sci placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={streamStatus === "streaming"}
                />
                <button
                  onClick={() => {
                    if (!manualText.trim()) return;
                    const data: ScientificCsvPoint[] = [];
                    let t_s = 0;
                    const LOW: ScientificCsvPoint = { time_s: 0, sound_freq_hz: 0, ph_level: 7.0, od600: 0.05, color_intensity: 2.0 };
                    const pushLow = (n: number) => { for (let i = 0; i < n; i++) { data.push({ ...LOW, time_s: t_s }); t_s += 5; } };
                    const pushHigh = (n: number, freq: number, od: number, ph: number) => { for (let i = 0; i < n; i++) { data.push({ time_s: t_s, sound_freq_hz: freq, ph_level: ph, od600: od, color_intensity: od * 40 }); t_s += 5; } };
                    const words = manualText.trim().split(/\s+/);
                    pushLow(2);
                    words.forEach((word, wi) => {
                      if (wi > 0) pushLow(7);
                      [...word].forEach((ch, ci) => {
                        if (ci > 0) pushLow(4);
                        const morse = MORSE_MAP[ch];
                        if (!morse) return;
                        [...morse].forEach((sym, si) => {
                          if (si > 0) pushLow(1);
                          if (sym === ".") pushHigh(2, 100, 0.8, 6.2);
                          else pushHigh(4, 10000, 0.9, 6.0);
                        });
                      });
                    });
                    pushLow(7);
                    handleReset();
                    setTimeout(() => {
                      setPendingData(data);
                      setCsvLoaded(true);
                      setCsvFileName(`SIM:${manualText.trim()}`);
                      addLog(`[SIM] Generated ${data.length} ticks for "${manualText.trim()}"`);
                      tickIndexRef.current = 0;
                      setStreamStatus("streaming");
                      addLog(`[SYS] Streaming STARTED (${speed} — ${SPEED_MS[speed]}ms/tick)`);
                      const iv = setInterval(() => {
                        const idx = tickIndexRef.current;
                        if (idx >= data.length) {
                          clearInterval(iv); intervalRef.current = null;
                          if (morseBufferRef.current) {
                            const char = MORSE_TO_CHAR[morseBufferRef.current] || "?";
                            setDecodedLetters((prev) => [...prev, { char, morse: morseBufferRef.current }]);
                            wordBufferRef.current += char; morseBufferRef.current = "";
                          }
                          if (wordBufferRef.current) {
                            const w = wordBufferRef.current;
                            setDecodedWord(w);
                            const tr = TRANSLATION_DICT[w] || "";
                            if (tr) setTranslatedWord(tr);
                            wordBufferRef.current = "";
                          }
                          setStreamStatus("complete");
                          addLog("[SYS] ✓ STREAM COMPLETE — SELESAI");
                          return;
                        }
                        const pt = data[idx];
                        setActiveData((prev) => [...prev, pt]);
                        processTickDecode(pt);
                        tickIndexRef.current = idx + 1;
                      }, SPEED_MS[speed]);
                      intervalRef.current = iv;
                    }, 100);
                  }}
                  disabled={streamStatus === "streaming" || !manualText.trim()}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium disabled:opacity-40 hover:opacity-90 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" /> Simulasikan Sinyal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
