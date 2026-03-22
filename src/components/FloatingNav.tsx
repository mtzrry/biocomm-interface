import { useState } from "react";
import { Menu, X, FlaskConical, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

type View = "home" | "decoder" | "team" | "paper";

interface FloatingNavProps {
  currentView: View;
  setView: (v: View) => void;
  onResearcherAccess: () => void;
  onSettingsOpen: () => void;
  researcherName: string;
}

export default function FloatingNav({ currentView, setView, onResearcherAccess, onSettingsOpen, researcherName }: FloatingNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const navItems: { label: string; view: View }[] = [
    { label: t("home"), view: "home" },
    { label: t("decodeEngine"), view: "decoder" },
    { label: t("ourTeam"), view: "team" },
    { label: t("researchPaper"), view: "paper" },
  ];

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl">
      <div className="glass-nav rounded-full px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
          <FlaskConical className="w-5 h-5 text-primary" />
          <span className="hidden sm:inline font-mono-sci text-xs tracking-wider">BDT v2.0</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all whitespace-nowrap ${
                currentView === item.view
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSettingsOpen}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={t("settings")}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onResearcherAccess}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all whitespace-nowrap"
          >
            {researcherName ? researcherName.split(" ")[0] : t("researcherAccess")}
          </button>

          <button className="md:hidden p-1" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel-strong rounded-2xl mt-2 p-3 md:hidden"
          >
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => { setView(item.view); setMobileOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                  currentView === item.view
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
