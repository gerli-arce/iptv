import { useEffect, useState } from "react";

/**
 * Escribe y borra palabras en bucle (efecto maquina de escribir).
 * `words` debe ser una lista estable (una constante), no un arreglo nuevo en cada render.
 */
export function useTypewriter(words, { typeMs = 75, deleteMs = 38, holdMs = 1800, gapMs = 320, startMs = 500 } = {}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!words.length) return undefined;

    // Con "reducir movimiento" activo no animamos: se muestra la primera frase completa.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setText(words[0]);
      return undefined;
    }

    let wordIndex = 0;
    let length = 0;
    let deleting = false;
    let timer;

    const tick = () => {
      const word = words[wordIndex];

      if (!deleting) {
        length += 1;
        setText(word.slice(0, length));
        if (length === word.length) {
          deleting = true;
          timer = setTimeout(tick, holdMs);
          return;
        }
        timer = setTimeout(tick, typeMs);
        return;
      }

      length -= 1;
      setText(word.slice(0, length));
      if (length === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        timer = setTimeout(tick, gapMs);
        return;
      }
      timer = setTimeout(tick, deleteMs);
    };

    timer = setTimeout(tick, startMs);
    return () => clearTimeout(timer);
  }, [words, typeMs, deleteMs, holdMs, gapMs, startMs]);

  return text;
}
