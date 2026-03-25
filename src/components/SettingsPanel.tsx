import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Type, ALargeSmall, Globe } from "lucide-react";
import { useSettings, type Theme, type FontSize, type FontFamily } from "@/contexts/SettingsContext";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: Props) {
  const { theme, fontSize, fontFamily, setTheme, setFontSize, setFontFamily } = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const calibration = useCalibration();
  const calFileRef = useRef<HTMLInputElement>(null);

  const themes: { value: Theme; label: string; icon: typeof Sun; desc: string }[] = [
    { value: "light", label: t("cleanBioTech"), icon: Sun, desc: t("mintSlateClinical") },
    { value: "dark", label: t("cyberpunkBio"), icon: Moon, desc: t("darkNeonLab") },
  ];

  const sizes: { value: FontSize; label: string }[] = [
    { value: "small", label: t("small") },
    { value: "medium", label: t("medium") },
    { value: "large", label: t("large") },
  ];

  const fonts: { value: FontFamily; label: string; desc: string }[] = [
    { value: "inter", label: "Inter", desc: t("clinical") },
    { value: "roboto", label: "Roboto", desc: t("academic") },
  ];

  const languages: { value: Language; label: string; flag: string }[] = [
    { value: "en", label: "English (EN)", flag: "🇬🇧" },
    { value: "id", label: "Bahasa Indonesia (ID)", flag: "🇮🇩" },
  ];

  const handleCalibrationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { symbols, dictionary } = parseCalibrationCsv(text);
      if (symbols.length === 0 && dictionary.length === 0) return;
      calibration.setCalibration(symbols, dictionary, file.name);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass-panel-strong rounded-2xl p-6 w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-foreground mb-1">{t("settings")}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t("settingsDesc")}</p>

            {/* Language */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-mono-sci">
                <Globe className="w-3 h-3 inline mr-1.5" />{t("language")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLanguage(l.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      language === l.value
                        ? "border-primary bg-primary/10 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span className="text-base">{l.flag}</span>
                    <span className="text-xs font-medium">{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-mono-sci">
                <Sun className="w-3 h-3 inline mr-1.5" />{t("theme")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((th) => (
                  <button
                    key={th.value}
                    onClick={() => setTheme(th.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      theme === th.value
                        ? "border-primary bg-primary/10 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <th.icon className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-xs font-medium">{th.label}</div>
                      <div className="text-[10px] opacity-60">{th.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-mono-sci">
                <ALargeSmall className="w-3 h-3 inline mr-1.5" />{t("fontSizeLabel")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setFontSize(s.value)}
                    className={`px-3 py-2 rounded-xl border text-xs transition-all ${
                      fontSize === s.value
                        ? "border-primary bg-primary/10 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-mono-sci">
                <Type className="w-3 h-3 inline mr-1.5" />{t("fontFamily")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {fonts.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFontFamily(f.value)}
                    className={`px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      fontFamily === f.value
                        ? "border-primary bg-primary/10 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                    style={{ fontFamily: f.value === "roboto" ? "'Roboto', sans-serif" : "'Inter', sans-serif" }}
                  >
                    <div className="text-xs font-medium">{f.label}</div>
                    <div className="text-[10px] opacity-60">{f.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 font-mono-sci text-center">
                {t("fontNote")}
              </p>
            </div>

            {/* Calibration CSV Upload */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-mono-sci">
                <FlaskConical className="w-3 h-3 inline mr-1.5" />{t("calibrationModel")}
              </label>
              <input ref={calFileRef} type="file" accept=".csv" className="hidden" onChange={handleCalibrationUpload} />
              {calibration.loaded ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono-sci text-primary font-medium truncate max-w-[200px]">
                      {calibration.fileName}
                    </span>
                    <button
                      onClick={calibration.clearCalibration}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono-sci">
                    {calibration.symbols.length} {t("calibrationSymbols")} · {calibration.dictionary.length} {t("calibrationDictEntries")}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => calFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {t("uploadCalibration")}
                </button>
              )}
              <p className="text-[10px] text-muted-foreground mt-2 font-mono-sci text-center">
                {t("calibrationFormat")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
