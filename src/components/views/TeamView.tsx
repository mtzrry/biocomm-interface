import { motion } from "framer-motion";
import { Linkedin, Github } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const team = [
  { name: "Dr. Rina Setiawan", role: "Principal Investigator", bio: "Leads the chromoprotein expression and signal design research.", initials: "RS", color: "bg-emerald-100 text-emerald-700" },
  { name: "Andi Prasetyo", role: "IoT Engineer", bio: "Designs the embedded optical sensor array and data acquisition pipeline.", initials: "AP", color: "bg-teal-100 text-teal-700" },
  { name: "Farah Nabila", role: "Bio-Informatics Specialist", bio: "Develops signal-to-symbol mapping algorithms and biological sequence analysis.", initials: "FN", color: "bg-emerald-100 text-emerald-700" },
  { name: "Bimo Haryo", role: "Full Stack Developer", bio: "Architects the real-time web platform and data visualization layer.", initials: "BH", color: "bg-teal-100 text-teal-700" },
  { name: "Siti Khoirunnisa", role: "Hardware Lead", bio: "Oversees bioreactor integration and optical measurement calibration.", initials: "SK", color: "bg-emerald-100 text-emerald-700" },
  { name: "Raka Aditya", role: "UI/UX Architect", bio: "Crafts the clinical interface design and responsive dashboard experience.", initials: "RA", color: "bg-teal-100 text-teal-700" },
  { name: "Dian Lestari", role: "Data Analyst", bio: "Handles statistical modeling and signal pattern validation.", initials: "DL", color: "bg-emerald-100 text-emerald-700" },
];

export default function TeamView() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <p className="font-mono-sci text-xs tracking-[0.3em] text-primary mb-3 uppercase">{t("researchUnit")}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t("meetTeam")}</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("teamSubtitle")}
          </p>
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
              <div className={`w-14 h-14 rounded-full ${member.color} flex items-center justify-center font-bold text-lg mb-4`}>
                {member.initials}
              </div>
              <h3 className="font-semibold text-foreground text-sm">{member.name}</h3>
              <p className="font-mono-sci text-xs text-primary mb-2">{member.role}</p>
              <p className="text-muted-foreground text-xs leading-relaxed mb-4">{member.bio}</p>
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
