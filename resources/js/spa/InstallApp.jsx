import { createPortal } from "react-dom";
import { PlusSquare, Share, X } from "lucide-react";
import { closeIosHelp, openIosHelp, useIosHelp, usePwaInstall } from "./pwa";

function IosSteps({ onClose }) {
  const steps = [
    { Icon: Share, text: 'Toca el botón "Compartir" de Safari (el cuadrado con la flecha hacia arriba).' },
    { Icon: PlusSquare, text: 'Elige "Agregar a pantalla de inicio".' },
    { Icon: null, text: 'Toca "Agregar". Fastnet Player aparecerá como una app en tu pantalla de inicio.' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-end bg-black/70 p-3 backdrop-blur-sm sm:place-items-center" role="dialog" aria-label="Instalar Fastnet Player" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d11] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.7)]" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.01em]">Instala Fastnet Player</h2>
            <p className="mt-1 text-sm text-zinc-400">En iPhone se instala desde Safari:</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-zinc-300 transition hover:bg-white/20 hover:text-white">
            <X className="size-4" />
          </button>
        </div>
        <ol className="space-y-3.5">
          {steps.map(({ Icon, text }, index) => (
            <li key={text} className="flex items-start gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-coral/40 bg-coral/10 font-mono text-xs font-bold text-coral-soft">{index + 1}</span>
              <p className="flex-1 text-sm leading-relaxed text-zinc-300">{text}</p>
              {Icon ? <Icon className="mt-0.5 size-5 shrink-0 text-zinc-500" /> : null}
            </li>
          ))}
        </ol>
        <button onClick={onClose} className="mt-5 w-full rounded-lg bg-coral py-2.5 text-sm font-semibold text-white transition hover:bg-coral-soft">
          Entendido
        </button>
      </div>
    </div>,
    document.body,
  );
}

// Muestra su contenido solo si la web se puede instalar en este dispositivo. children recibe { onClick }.
// Android/escritorio con Chrome: abre el aviso de instalacion. iPhone: explica los pasos de Safari.
export function InstallAction({ children }) {
  const { canInstall, ios, install } = usePwaInstall();
  if (!canInstall) return null;

  return children({ onClick: () => (ios ? openIosHelp() : install()) });
}

// Se monta una vez en la raiz de cada pagina: muestra los pasos de iPhone cuando se piden.
export function InstallHost() {
  const open = useIosHelp();
  return open ? <IosSteps onClose={closeIosHelp} /> : null;
}
