import { useState } from "react";
import Header from "./components/layout/Header";
import ManualModal from "./components/layout/ManualModal";
import Downloads from "./components/sections/Downloads";
import Features from "./components/sections/Features";
import Hero from "./components/sections/Hero";
import Pricing from "./components/sections/Pricing";
import Testimonials from "./components/sections/Testimonials";
import FloatingActions from "./components/ui/FloatingActions";
import { FOOTER_TEXT } from "./data/constants";

function LandingApp() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink font-display text-zinc-100 antialiased selection:bg-coral/30">
      <ManualModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <Features />
          <Downloads onOpenManual={() => setIsModalOpen(true)} />
          <Pricing />
          <Testimonials />
        </main>
        <footer className="border-t border-white/[0.06] py-6">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
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
