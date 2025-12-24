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

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,116,144,0.08)_1px,transparent_1px),linear-gradient(rgba(14,116,144,0.08)_1px,transparent_1px)] bg-[size:120px_120px] opacity-40" />
        <div className="absolute -top-32 right-[-10%] h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      <ManualModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <Features />
          <Downloads />
          <Pricing />
          <Testimonials />
        </main>
        <footer className="border-t border-white/5 py-4">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 text-center">
              {FOOTER_TEXT}
            </p>
          </div>
        </footer>

        <FloatingActions onOpenManual={() => setIsModalOpen(true)} />
      </div>
    </div>
  );
}

export default App;
