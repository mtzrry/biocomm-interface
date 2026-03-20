import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface Props {
  onLaunch: () => void;
}

export default function HomeView({ onLaunch }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Spline 3D Background */}
      <iframe
        src="https://my.spline.design/wEibmkc-yCdFX1gT/"
        frameBorder="0"
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
        title="3D Background"
      />

      {/* Mobile fade overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-background/70 md:bg-background/40 pointer-events-none" />

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
