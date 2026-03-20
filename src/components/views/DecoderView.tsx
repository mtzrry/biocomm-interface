import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Upload, Activity, Droplets, Eye, FileUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { parseCsvToSignalData, type CsvSignalPoint } from "@/lib/csv-parser";

interface Props {
  researcherName: string;
  institution: string;
}

const TARGET_WORD = "UNDIP";
const THRESHOLD = 0.6;

function generateSignalPoint(tick: number) {
  const base = Math.sin(tick * 0.15) * 0.3 + 0.5;
  const noise = (Math.random() - 0.5) * 0.15;
  return Math.max(0, Math.min(1, base + noise));
}

export default function DecoderView({ researcherName, institution }: Props) {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<CsvSignalPoint[]>([]);
  const [decodedChars, setDecodedChars] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>(["[SYS] Decoder Engine initialized.", "[SYS] Awaiting START command..."]);
  const [targetSeq, setTargetSeq] = useState(TARGET_WORD);
  const [csvLoaded, setCsvLoaded] = useState(false);
  const [csvFileName, setCsvFileName] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ph = (7.2 - tick * 0.003).toFixed(2);
  const od600 = (0.05 + tick * 0.004).toFixed(3);
  const colorIntensity = Math.min(100, tick * 0.8).toFixed(1);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-50), msg]);
  }, []);

  // Handle CSV upload
  const handleCsvUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const parsed = parseCsvToSignalData(text, THRESHOLD);
        if (parsed.length === 0) {
          addLog("[ERR] CSV parsing failed — no valid signal data found.");
          return;
        }
        setData(parsed);
        setCsvLoaded(true);
        setCsvFileName(file.name);
        setRunning(false);
        setTick(parsed.length);
        addLog(`[CSV] Loaded "${file.name}" — ${parsed.length} data points.`);
        addLog(`[CSV] Signal range: ${Math.min(...parsed.map((d) => d.signal)).toFixed(3)} – ${Math.max(...parsed.map((d) => d.signal)).toFixed(3)}`);
      };
      reader.readAsText(file);
      // Reset input so same file can be re-uploaded
      e.target.value = "";
    },
    [addLog]
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
      addLog("[SYS] CSV data loaded — chart displays uploaded data.");
      return;
    }
    setRunning(true);
    addLog("[SYS] Signal acquisition STARTED.");
  };
  const handlePause = () => {
    setRunning(false);
    addLog("[SYS] Signal acquisition PAUSED.");
  };
  const handleReset = () => {
    setRunning(false);
    setTick(0);
    setData([]);
    setDecodedChars([]);
    setCsvLoaded(false);
    setCsvFileName("");
    setLogs(["[SYS] Decoder Engine RESET.", "[SYS] Awaiting START command..."]);
  };

  const timeline = data.slice(-40);
  const chartData = csvLoaded ? data : data.slice(-60);

  return (
    <div className="min-h-screen pt-20 pb-10 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Decoder Dashboard</h2>
            <p className="text-xs text-muted-foreground font-mono-sci">BIO-DIGITAL TRANSDUCER v2.0</p>
          </div>
          <div className="flex items-center gap-2">
            {csvLoaded && (
              <div className="glass-panel rounded-full px-3 py-1.5 text-xs font-mono-sci text-accent">
                <FileUp className="w-3 h-3 inline mr-1" />
                {csvFileName}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column */}
          <div className="lg:col-span-8 space-y-4">
            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "pH Level", value: ph, icon: Droplets, color: "text-primary" },
                { label: "OD600", value: od600, icon: Activity, color: "text-teal-600" },
                { label: "Color Intensity", value: `${colorIntensity}%`, icon: Eye, color: "text-emerald-500" },
              ].map((m) => (
                <div key={m.label} className="glass-panel-strong rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                  </div>
                  <p className="text-2xl font-bold font-mono-sci text-foreground">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="glass-panel-strong rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-3 font-mono-sci">
                Signal Curve — {csvLoaded ? `CSV Data (${data.length} pts)` : "Real-time"}
              </p>
              <div className="h-52 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 20% 90%)" />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" />
                    <Tooltip contentStyle={{ background: "hsl(0 0% 100% / 0.9)", border: "1px solid hsl(160 20% 90%)", borderRadius: 12, fontSize: 12 }} />
                    <Line type="monotone" dataKey="signal" stroke="#10b981" strokeWidth={2} dot={csvLoaded && data.length < 100} />
                    <ReferenceLine y={THRESHOLD} stroke="#06b6d4" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: "Threshold", fill: "#06b6d4", fontSize: 10 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeline raster */}
            <div className="glass-panel-strong rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2 font-mono-sci">Signal Timeline</p>
              <div className="flex gap-0.5 overflow-x-auto">
                {timeline.map((d, i) => (
                  <div
                    key={i}
                    className={`w-3 h-6 rounded-sm flex-shrink-0 transition-colors ${d.signal >= THRESHOLD ? "bg-primary" : "bg-muted"}`}
                    title={`t=${d.t} val=${d.signal.toFixed(3)}`}
                  />
                ))}
              </div>
            </div>

            {/* Decoded output */}
            <div className="glass-panel-strong rounded-xl p-5 text-center">
              <p className="text-xs text-muted-foreground mb-2 font-mono-sci">Decoded Output</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {targetSeq.split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={i < decodedChars.length ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.2 }}
                    className="w-12 h-14 flex items-center justify-center rounded-lg border border-border text-xl font-bold font-mono-sci text-foreground bg-muted/50"
                  >
                    {i < decodedChars.length ? decodedChars[i] : "?"}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-4">
            {/* Terminal */}
            <div className="terminal-panel rounded-xl p-4 h-72 lg:h-96 flex flex-col">
              <p className="text-xs opacity-60 mb-2">// SYSTEM LOG</p>
              <div ref={logRef} className="flex-1 overflow-y-auto text-xs leading-relaxed space-y-0.5 scrollbar-thin">
                {logs.map((l, i) => (
                  <div key={i} className={l.startsWith("[CSV]") ? "text-emerald-400" : l.startsWith("[ERR]") ? "text-red-400" : "opacity-80"}>
                    {l}
                  </div>
                ))}
                {running && <span className="animate-pulse-glow">▌</span>}
              </div>
            </div>

            {/* Controls */}
            <div className="glass-panel-strong rounded-xl p-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block font-mono-sci">Target Sequence</label>
                <input
                  value={targetSeq}
                  onChange={(e) => setTargetSeq(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono-sci focus:outline-none focus:ring-2 focus:ring-primary/40"
                  disabled={running}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleStart} disabled={running} className="flex items-center justify-center gap-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 glow-btn">
                  <Play className="w-3 h-3" /> START
                </button>
                <button onClick={handlePause} disabled={!running} className="flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-foreground text-xs font-medium disabled:opacity-40 hover:bg-muted transition-colors">
                  <Pause className="w-3 h-3" /> PAUSE
                </button>
                <button onClick={handleReset} className="flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors">
                  <RotateCcw className="w-3 h-3" /> RESET
                </button>
              </div>

              {/* CSV Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvUpload}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-primary/40 text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {csvLoaded ? "Replace CSV" : "Upload CSV"}
                </button>
                <button
                  onClick={() => {
                    const sample = "time,signal\n0,0.12\n1,0.18\n2,0.25\n3,0.31\n4,0.44\n5,0.52\n6,0.61\n7,0.73\n8,0.65\n9,0.58\n10,0.49\n11,0.42\n12,0.55\n13,0.68\n14,0.77\n15,0.82\n16,0.74\n17,0.63\n18,0.51\n19,0.39\n20,0.28";
                    const blob = new Blob([sample], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "sample_signal_data.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                    addLog("[SYS] Sample CSV downloaded.");
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Sample CSV
                </button>
              </div>
              <p className="text-xs text-muted-foreground font-mono-sci text-center">
                Expected columns: time, signal (0–1)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
