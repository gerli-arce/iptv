import { useCallback, useEffect, useState } from "react";

// Instalacion de la web como aplicacion. El aviso de instalacion del navegador lo guarda partials/pwa.blade.php
// en window.__pwa.prompt antes de que cargue React.

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return Boolean(window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);
}

export function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function usePwaInstall() {
  const [, refresh] = useState(0);

  useEffect(() => {
    const onChange = () => refresh((n) => n + 1);
    window.addEventListener("pwa:change", onChange);
    return () => window.removeEventListener("pwa:change", onChange);
  }, []);

  const standalone = isStandalone();
  const prompt = (typeof window !== "undefined" && window.__pwa?.prompt) || null;
  // En iPhone no hay aviso del navegador: se explica el paso "Agregar a pantalla de inicio".
  const ios = isIos() && !standalone;

  const install = useCallback(async () => {
    if (!prompt) return "manual";
    prompt.prompt();
    const choice = await prompt.userChoice.catch(() => ({ outcome: "dismissed" }));
    window.__pwa.prompt = null;
    window.dispatchEvent(new Event("pwa:change"));
    return choice.outcome;
  }, [prompt]);

  return { canInstall: !standalone && (Boolean(prompt) || ios), ios, standalone, install };
}

// Aviso con los pasos para iPhone. Vive fuera de los menus (InstallHost, montado en la raiz de cada pagina)
// para que no se cierre junto con el menu desde el que se abrio.
let iosHelpOpen = false;
const iosListeners = new Set();
const notifyIos = () => iosListeners.forEach((listener) => listener());

export const openIosHelp = () => {
  iosHelpOpen = true;
  notifyIos();
};

export const closeIosHelp = () => {
  iosHelpOpen = false;
  notifyIos();
};

export function useIosHelp() {
  const [open, setOpen] = useState(iosHelpOpen);
  useEffect(() => {
    const onChange = () => setOpen(iosHelpOpen);
    iosListeners.add(onChange);
    return () => iosListeners.delete(onChange);
  }, []);
  return open;
}
