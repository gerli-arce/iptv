import { useState } from "react";
import Header from "./components/layout/Header";
import LeadModal from "./components/layout/LeadModal";
import ManualModal from "./components/layout/ManualModal";
import TrialModal from "./components/layout/TrialModal";
import About from "./components/sections/About";
import Downloads from "./components/sections/Downloads";
import Faq from "./components/sections/Faq";
import Features from "./components/sections/Features";
import Hero from "./components/sections/Hero";
import Pricing from "./components/sections/Pricing";
import Testimonials from "./components/sections/Testimonials";
import FloatingActions from "./components/ui/FloatingActions";
import { DEMO_LEAD, FOOTER_LINKS, FOOTER_TEXT, TRIAL_ENABLED, planLead } from "./data/constants";
import { InstallHost } from "../spa/InstallApp";

const TRIAL_HASH = "#prueba-gratis";

function LandingApp() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // /#prueba-gratis (p. ej. desde el login) abre directamente el formulario de prueba: el automatico si esta
  // activo, si no la demo por WhatsApp.
  const openedFromLink = window.location.hash === TRIAL_HASH;
  const [lead, setLead] = useState(() => (openedFromLink && !TRIAL_ENABLED ? DEMO_LEAD : null));
  const [isTrialOpen, setIsTrialOpen] = useState(() => openedFromLink && TRIAL_ENABLED);
  const openTrial = () => (TRIAL_ENABLED ? setIsTrialOpen(true) : setLead(DEMO_LEAD));

  // Sin el hash, recargar la pagina no vuelve a abrir el formulario.
  const clearTrialHash = () => {
    if (window.location.hash === TRIAL_HASH) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };
  const closeTrial = () => {
    setIsTrialOpen(false);
    clearTrialHash();
  };
  const closeLead = () => {
    setLead(null);
    clearTrialHash();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink font-display text-zinc-100 antialiased selection:bg-coral/30">
      <ManualModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <LeadModal lead={lead} onClose={closeLead} />
      {TRIAL_ENABLED && <TrialModal isOpen={isTrialOpen} onClose={closeTrial} />}

      <div className="relative z-10">
        <InstallHost />
        <Header />
        <main>
          <Hero onOpenDemo={openTrial} />
          <About />
          <Features />
          <Downloads onOpenManual={() => setIsModalOpen(true)} />
          <Pricing onSelectPlan={(plan) => setLead(planLead(plan))} />
          <Testimonials />
          <Faq />
        </main>
        <footer className="border-t border-white/[0.06] py-6">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <nav aria-label="Enlaces legales" className="mb-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-zinc-400">
              {FOOTER_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="transition hover:text-white">
                  {link.label}
                </a>
              ))}
            </nav>
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              {FOOTER_TEXT}
            </p>
          </div>
        </footer>

        <FloatingActions onOpenManual={() => setIsModalOpen(true)} />
      </div>
    </div>
  );
}

export default LandingApp;
