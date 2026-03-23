import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Language = "en" | "id";

const translations = {
  en: {
    // Nav
    home: "Home",
    decodeEngine: "Decode Engine",
    ourTeam: "Our Team",
    researchPaper: "Research Paper",
    researcherAccess: "Researcher Access",
    // Home
    heroSubtitle: "Bio-Digital Transducer v2.0",
    heroTitle1: "Biological",
    heroTitle2: "Communication",
    heroTitle3: "Interface",
    heroDesc: "Decoding bacterial chromoprotein signals into human-readable information through real-time optical analysis and pattern recognition.",
    launchBtn: "LAUNCH DECODER ENGINE",
    // Dashboard
    decoderDashboard: "Decoder Dashboard",
    phLevel: "pH Level",
    od600: "OD600",
    colorIntensity: "Color Intensity",
    signalTimeline: "Signal Timeline",
    od600Timeline: "OD600 Timeline",
    decodedOutput: "Decoded Output",
    morseDecodeLabel: "Morse Decode (· = 100Hz DOT, − = 10kHz DASH)",
    noStimulus: "No stimulus periods detected",
    targetSequence: "Target Sequence",
    start: "START",
    pause: "PAUSE",
    reset: "RESET",
    uploadCsv: "Upload CSV",
    replaceCsv: "Replace CSV",
    sampleCsv: "Sample CSV",
    csvFormat: "Format: time_s, sound_freq_hz, ph_level, od600, color_intensity",
    simulationMode: "Simulation Mode",
    systemLog: "System Log",
    // Sensory feedback
    sensoryFeedback: "Audio / Haptic",
    sensoryOn: "ON",
    sensoryOff: "OFF",
    // Decoded output
    decodedResultLabel: "Decoded Result",
    morseRepresentation: "Morse Representation",
    // Calibration
    calibrationModel: "Calibration Model",
    uploadCalibration: "Upload Calibration Model (CSV)",
    calibrationLoaded: "Calibration loaded",
    calibrationFormat: "Header: type, character, morse_code, min_duration_s, max_duration_s, avg_ph_drop, avg_od_spike",
    clearCalibration: "Clear Calibration",
    calibrationSymbols: "symbols",
    calibrationDictEntries: "dictionary entries",
    // Logs
    logInit: "[SYS] Decoder Engine initialized.",
    logAwaiting: "[SYS] Awaiting START command...",
    logStarted: "[SYS] Signal acquisition STARTED.",
    logPaused: "[SYS] Signal acquisition PAUSED.",
    logReset: "[SYS] Decoder Engine RESET.",
    logCsvLoaded: "[SYS] CSV data loaded — chart displays uploaded data.",
    logSampleDownloaded: "[SYS] Scientific sample CSV downloaded (Harris et al. format).",
    logCalibrationLoaded: "[CAL] Calibration model loaded.",
    logCalibrationCleared: "[CAL] Calibration model cleared.",
    // Team
    researchUnit: "Research Unit",
    meetTeam: "Meet the Research Team",
    teamSubtitle: "The multidisciplinary minds behind the Bio-Digital Transducer.",
    // Paper
    publication: "Publication",
    researchPaperTitle: "Research Paper",
    paperSubtitle: "Peer-reviewed documentation of the Bio-Digital Transducer methodology.",
    paperTitle: "Bio-Digital Transducer: Encoding and Decoding Information Using Bacterial Chromoprotein Expression",
    paperAbstract: "This study presents a novel biological communication system that encodes digital information into living bacteria through chromoprotein gene expression. Optical sensors measure color intensity changes in real-time, which are decoded by a web-based signal processing engine into human-readable text.",
    paperKeywords: "synthetic biology, chromoprotein, IoT, biological encoding, signal processing",
    viewFullPaper: "View Full Paper",
    // Settings
    settings: "Settings",
    settingsDesc: "Configure the interface appearance.",
    theme: "Theme",
    fontSizeLabel: "Font Size",
    fontFamily: "Font Family",
    language: "Language",
    cleanBioTech: "Clean Bio-Tech",
    cyberpunkBio: "Cyberpunk Bio",
    mintSlateClinical: "Mint/slate clinical",
    darkNeonLab: "Dark neon laboratory",
    small: "Small",
    medium: "Medium",
    large: "Large",
    clinical: "Clinical UI",
    academic: "Academic UI",
    fontNote: "JetBrains Mono remains fixed for all numeric/terminal data.",
    // Researcher modal
    researcherIdentity: "Researcher Identity",
    researcherModalDesc: "Enter your credentials to personalize the interface.",
    fullName: "Full Name",
    institution: "Institution",
    saveIdentity: "Save Identity",
  },
  id: {
    home: "Beranda",
    decodeEngine: "Mesin Dekoder",
    ourTeam: "Tim Kami",
    researchPaper: "Makalah Riset",
    researcherAccess: "Akses Peneliti",
    heroSubtitle: "Bio-Digital Transducer v2.0",
    heroTitle1: "Antarmuka",
    heroTitle2: "Komunikasi",
    heroTitle3: "Biologis",
    heroDesc: "Menerjemahkan respons mikroba menjadi teks digital melalui analisis optik real-time dan pengenalan pola.",
    launchBtn: "LUNCURKAN MESIN DEKODER",
    decoderDashboard: "Dasbor Dekoder",
    phLevel: "Level pH",
    od600: "OD600",
    colorIntensity: "Intensitas Warna",
    signalTimeline: "Lini Waktu Sinyal",
    od600Timeline: "Lini Waktu OD600",
    decodedOutput: "Output Terdekode",
    morseDecodeLabel: "Dekode Morse (· = 100Hz TITIK, − = 10kHz GARIS)",
    noStimulus: "Tidak ada periode stimulus terdeteksi",
    targetSequence: "Urutan Target",
    start: "MULAI",
    pause: "JEDA",
    reset: "ULANG",
    uploadCsv: "Unggah CSV",
    replaceCsv: "Ganti CSV",
    sampleCsv: "Contoh CSV",
    csvFormat: "Format: time_s, sound_freq_hz, ph_level, od600, color_intensity",
    simulationMode: "Mode Simulasi",
    systemLog: "Log Sistem",
    logInit: "[SIS] Mesin Dekoder diinisialisasi.",
    logAwaiting: "[SIS] Menunggu sinyal...",
    logStarted: "[SIS] Akuisisi sinyal DIMULAI.",
    logPaused: "[SIS] Akuisisi sinyal DIJEDA.",
    logReset: "[SIS] Mesin Dekoder DIULANG.",
    logCsvLoaded: "[SIS] Data CSV dimuat — grafik menampilkan data unggahan.",
    logSampleDownloaded: "[SIS] Contoh CSV ilmiah diunduh (format Harris et al.).",
    researchUnit: "Unit Riset",
    meetTeam: "Temui Tim Peneliti",
    teamSubtitle: "Para pemikir multidisiplin di balik Bio-Digital Transducer.",
    publication: "Publikasi",
    researchPaperTitle: "Makalah Riset",
    paperSubtitle: "Dokumentasi peer-reviewed metodologi Bio-Digital Transducer.",
    paperTitle: "Bio-Digital Transducer: Pengkodean dan Dekode Informasi Menggunakan Ekspresi Kromoprotein Bakteri",
    paperAbstract: "Studi ini menyajikan sistem komunikasi biologis baru yang mengkodekan informasi digital ke dalam bakteri hidup melalui ekspresi gen kromoprotein. Sensor optik mengukur perubahan intensitas warna secara real-time, yang didekodekan oleh mesin pemrosesan sinyal berbasis web menjadi teks yang dapat dibaca manusia.",
    paperKeywords: "biologi sintetis, kromoprotein, IoT, pengkodean biologis, pemrosesan sinyal",
    viewFullPaper: "Lihat Makalah Lengkap",
    settings: "Pengaturan",
    settingsDesc: "Konfigurasikan tampilan antarmuka.",
    theme: "Tema",
    fontSizeLabel: "Ukuran Font",
    fontFamily: "Jenis Font",
    language: "Bahasa",
    cleanBioTech: "Clean Bio-Tech",
    cyberpunkBio: "Cyberpunk Bio",
    mintSlateClinical: "Klinis mint/slate",
    darkNeonLab: "Laboratorium neon gelap",
    small: "Kecil",
    medium: "Sedang",
    large: "Besar",
    clinical: "UI Klinis",
    academic: "UI Akademik",
    fontNote: "JetBrains Mono tetap digunakan untuk semua data numerik/terminal.",
    researcherIdentity: "Identitas Peneliti",
    researcherModalDesc: "Masukkan kredensial Anda untuk mempersonalisasi antarmuka.",
    fullName: "Nama Lengkap",
    institution: "Institusi",
    saveIdentity: "Simpan Identitas",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LanguageState {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageState | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem("bdt-language") as Language) || "en"
  );

  useEffect(() => {
    localStorage.setItem("bdt-language", language);
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  const t = (key: TranslationKey): string => translations[language][key];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
