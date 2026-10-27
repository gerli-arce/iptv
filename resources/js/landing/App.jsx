import { useState } from "react";
import Header from "./components/layout/Header";
import ManualModal from "./components/layout/ManualModal";
import About from "./components/sections/About";
import Downloads from "./components/sections/Downloads";
import Faq from "./components/sections/Faq";
import Features from "./components/sections/Features";
import Hero from "./components/sections/Hero";
import Pricing from "./components/sections/Pricing";
import Testimonials from "./components/sections/Testimonials";
import FloatingActions from "./components/ui/FloatingActions";
import { FOOTER_LINKS, FOOTER_TEXT } from "./data/constants";
import { HalloweenBats } from "../spa/Halloween";

function LandingApp() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink font-display text-zinc-100 antialiased selection:bg-coral/30">
      <ManualModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="relative z-10">
        <HalloweenBats fixed />
        <Header />
        <main>
          <Hero />
          <About />
          <Features />
          <Downloads onOpenManual={() => setIsModalOpen(true)} />
          <Pricing />
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
