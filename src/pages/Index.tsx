import { useState } from "react";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import FloatingNav from "@/components/FloatingNav";
import ResearcherModal from "@/components/ResearcherModal";
import SettingsPanel from "@/components/SettingsPanel";
import HomeView from "@/components/views/HomeView";
import DecoderView from "@/components/views/DecoderView";
import TeamView from "@/components/views/TeamView";
import PaperView from "@/components/views/PaperView";

type View = "home" | "decoder" | "team" | "paper";

export default function Index() {
  const [view, setView] = useState<View>("home");
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [researcherName, setResearcherName] = useState("");
  const [institution, setInstitution] = useState("");

  return (
    <SettingsProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-background">
          <FloatingNav
            currentView={view}
            setView={setView}
            onResearcherAccess={() => setModalOpen(true)}
            onSettingsOpen={() => setSettingsOpen(true)}
            researcherName={researcherName}
          />

          {view === "home" && <HomeView onLaunch={() => setView("decoder")} />}
          {view === "decoder" && <DecoderView researcherName={researcherName} institution={institution} />}
          {view === "team" && <TeamView />}
          {view === "paper" && <PaperView />}

          <ResearcherModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={(n, i) => { setResearcherName(n); setInstitution(i); }}
            initialName={researcherName}
            initialInstitution={institution}
          />

          <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
      </LanguageProvider>
    </SettingsProvider>
  );
}
