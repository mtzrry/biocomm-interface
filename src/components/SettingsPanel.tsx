import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Type, ALargeSmall } from "lucide-react";
import { useSettings, type Theme, type FontSize, type FontFamily } from "@/contexts/SettingsContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: Props) {
  const { theme, fontSize, fontFamily, setTheme, setFontSize, setFontFamily } = useSettings();

  const themes: { value: Theme; label: string; icon: typeof Sun; desc: string }[] = [
    { value: "light", label: "Clean Bio-Tech", icon: Sun, desc: "Mint/slate clinical" },
    { value: "dark", label: "Cyberpunk Bio", icon: Moon, desc: "Dark neon laboratory" },
  ];

  const sizes: { value: FontSize; label: string }[] = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];

  const fonts: { value: FontFamily; label: string; desc: string }[] = [
    { value: "inter", label: "Inter", desc: "Clinical UI" },
    { value: "roboto", label: "Roboto", desc: "Academic UI" },
  ];

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
            className="glass-panel-strong rounded-2xl p-6 w-full max-w-md relative z-10"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-foreground mb-1">Settings</h2>
            <p className="text-sm text-muted-foreground mb-6">Configure the interface appearance.</p>

            {/* Theme */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-mono-sci">
                <Sun className="w-3 h-3 inline mr-1.5" />Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      theme === t.value
                        ? "border-primary bg-primary/10 text-foreground font-medium"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-xs font-medium">{t.label}</div>
                      <div className="text-[10px] opacity-60">{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-mono-sci">
                <ALargeSmall className="w-3 h-3 inline mr-1.5" />Font Size
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
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-mono-sci">
                <Type className="w-3 h-3 inline mr-1.5" />Font Family
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
                JetBrains Mono remains fixed for all numeric/terminal data.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
