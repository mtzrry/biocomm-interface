import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Building } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, institution: string) => void;
  initialName: string;
  initialInstitution: string;
}

export default function ResearcherModal({ open, onClose, onSave, initialName, initialInstitution }: Props) {
  const [name, setName] = useState(initialName);
  const [institution, setInstitution] = useState(initialInstitution);

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
            <h2 className="text-lg font-semibold text-foreground mb-1">Researcher Identity</h2>
            <p className="text-sm text-muted-foreground mb-5">Enter your credentials to personalize the interface.</p>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Institution"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <button
                onClick={() => { onSave(name, institution); onClose(); }}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm glow-btn"
              >
                Save Identity
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
