import { motion } from "framer-motion";
import { FileText, ExternalLink } from "lucide-react";

export default function PaperView() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <p className="font-mono-sci text-xs tracking-[0.3em] text-primary mb-3 uppercase">Publication</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Research Paper</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Peer-reviewed documentation of the Bio-Digital Transducer methodology.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel-strong rounded-2xl p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Bio-Digital Transducer: Encoding and Decoding Information Using Bacterial Chromoprotein Expression</h3>
              <p className="text-xs text-muted-foreground font-mono-sci">Setiawan et al., 2025</p>
            </div>
          </div>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p><span className="font-semibold text-foreground">Abstract:</span> This study presents a novel biological communication system that encodes digital information into living bacteria through chromoprotein gene expression. Optical sensors measure color intensity changes in real-time, which are decoded by a web-based signal processing engine into human-readable text.</p>
            <p><span className="font-semibold text-foreground">Keywords:</span> <span className="font-mono-sci text-xs">synthetic biology, chromoprotein, IoT, biological encoding, signal processing</span></p>
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm glow-btn">
              <ExternalLink className="w-4 h-4" />
              View Full Paper
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
