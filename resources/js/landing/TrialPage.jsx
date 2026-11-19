import { motion } from "framer-motion";
import { Clapperboard, CreditCard, Tv } from "lucide-react";
import { useRef } from "react";
import TrialForm from "./components/trial/TrialForm";
import { FOOTER_LINKS, TRIAL } from "./data/constants";

const BENEFITS = [
  { icon: Tv, label: "+150 canales HD" },
  { icon: Clapperboard, label: "Películas y series" },
  { icon: CreditCard, label: "Sin tarjeta" },
];

const STEPS = ["Llena tus datos", "Descarga la app", "Inicia sesión y disfruta"];

// Pagina propia de la prueba gratis (/prueba-gratis): destino del boton de la landing, del login y del QR impreso.
function TrialPage() {
  const cardRef = useRef(null);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink font-display text-zinc-100 antialiased selection:bg-coral/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(255,99,99,0.18),transparent_65%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-8 pt-6 sm:px-6">
        <header className="flex justify-center">
          <a href="/" aria-label="Fastnet Player, ir al inicio">
            <img src="/logo-fastnet-wordmark.png" alt="Fastnet Player" width="636" height="344" className="h-auto w-32 sm:w-36" />
          </a>
        </header>

        <main className="flex-1">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-center"
          >
            <h1 className="text-[2rem] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-4xl">
              Crea tu usuario de Fastnet Player{" "}
              <span className="bg-gradient-to-r from-coral to-coral-soft bg-clip-text text-transparent">
                gratis por {TRIAL.days} días
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-300 sm:text-base">
              Sin compromiso. Llena tus datos, crea tu usuario y empieza a ver hoy mismo en tu celular, tablet o Smart TV.
            </p>

            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {BENEFITS.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-200">
                  <Icon className="h-3.5 w-3.5 text-coral-soft" />
                  {label}
                </li>
              ))}
            </ul>

            <ol className="mt-5 grid grid-cols-3 gap-2 text-left">
              {STEPS.map((step, index) => (
                <li key={step} className="flex items-start gap-2 text-[11px] leading-tight text-zinc-400 sm:text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral/15 font-mono text-[10px] font-bold text-coral-soft">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </motion.section>

          <motion.section
            ref={cardRef}
            aria-label="Formulario de prueba gratis"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 scroll-mt-4 rounded-2xl border border-white/10 bg-[#0d0d11] p-5 shadow-2xl sm:p-6"
          >
            <TrialForm onCreated={() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
          </motion.section>

          <p className="mt-5 text-center text-sm text-zinc-400">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="font-semibold text-zinc-100 underline-offset-4 hover:underline">
              Inicia sesión
            </a>{" "}
            ·{" "}
            <a href="/#pricing" className="font-semibold text-zinc-100 underline-offset-4 hover:underline">
              Ver planes
            </a>
          </p>
        </main>

        <footer className="mt-8 border-t border-white/[0.06] pt-4">
          <nav aria-label="Enlaces legales" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-zinc-500">
            {FOOTER_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>
        </footer>
      </div>
    </div>
  );
}

export default TrialPage;
