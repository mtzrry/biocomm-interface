import { motion } from "framer-motion";
import { Linkedin, Github } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function hashStringToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [160, 174, 220, 240, 200, 150, 190];
  const hue = hues[Math.abs(hash) % hues.length];
  return `hsl(${hue}, 45%, 90%)`;
}

function hashStringToTextColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [160, 174, 220, 240, 200, 150, 190];
  const hue = hues[Math.abs(hash) % hues.length];
  return `hsl(${hue}, 50%, 35%)`;
}

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const team = [
  { name: "Nawaal Hanif Mumtaz Arriye", role: "Informatika" },
  { name: "Aliffya Gadiza Ramadhania", role: "Bioteknologi" },
  { name: "Silvia Nisa Ananda Zulpan", role: "Bioteknologi" },
  { name: "Fatih Muqtafi Liamrillah", role: "Teknik Elektro" },
  { name: "Moses Morell Yosefan", role: "Informatika" },
  { name: "Fazl Nizam Priyambodho", role: "Informatika" },
  { name: "Lintang Aulia Nuraini", role: "Informatika" },
];

export default function TeamView() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <p className="font-mono-sci text-xs tracking-[0.3em] text-primary mb-3 uppercase">{t("researchUnit")}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t("meetTeam")}</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">{t("teamSubtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-items-center">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-panel-strong rounded-2xl p-6 w-full max-w-xs hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-default"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-4"
                style={{
                  backgroundColor: hashStringToColor(member.name),
                  color: hashStringToTextColor(member.name),
                }}
              >
                {getInitials(member.name)}
              </div>
              <h3 className="font-semibold text-foreground text-sm">{member.name}</h3>
              <p className="font-mono-sci text-xs text-primary mb-2">{member.role}</p>
              <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                Pengembang Dan Peneliti Micorse
              </p>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Linkedin className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Github className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
