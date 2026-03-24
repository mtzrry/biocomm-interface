import { motion } from "framer-motion";
import { FileText, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PaperView() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <p className="font-mono-sci text-xs tracking-[0.3em] text-primary mb-3 uppercase">{t("publication")}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t("researchPaperTitle")}</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">{t("paperSubtitle")}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel-strong rounded-2xl p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t("paperTitle")}</h3>
              <p className="text-xs text-muted-foreground font-mono-sci">Micorse Research Team, 2025</p>
            </div>
          </div>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p><span className="font-semibold text-foreground">Abstract:</span> {t("paperAbstract")}</p>
            <p><span className="font-semibold text-foreground">Keywords:</span> <span className="font-mono-sci text-xs">{t("paperKeywords")}</span></p>
          </div>
          <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-3">
            <a
              href="https://drive.google.com/file/d/1QLQfkIyrLwbMz7doKNvyBNZbA2VTfBbK/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm glow-btn"
            >
              <ExternalLink className="w-4 h-4" />
              Lihat Makalah Penuh (View Full Paper)
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
