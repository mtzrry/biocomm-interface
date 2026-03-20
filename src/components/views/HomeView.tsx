import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import BioBackground from "@/components/BioBackground";

interface Props {
  onLaunch: () => void;
}

export default function HomeView({ onLaunch }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated particle background */}
      <BioBackground />

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[160px]" />
      </div>

      {/* Mobile fade overlay */}
      <div className="absolute inset-0 z-[2] bg-background/50 md:bg-background/30 pointer-events-none" />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <p className="font-mono-sci text-xs md:text-sm tracking-[0.3em] text-primary mb-4 uppercase">
            Bio-Digital Transducer v2.0
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight mb-6">
            Biological<br />
            <span className="text-gradient-bio">Communication</span><br />
            Interface
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-10 leading-relaxed">
            Decoding bacterial chromoprotein signals into human-readable information
            through real-time optical analysis and pattern recognition.
          </p>
          <motion.button
            onClick={onLaunch}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm glow-btn"
          >
            <Zap className="w-4 h-4" />
            LAUNCH DECODER ENGINE
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
