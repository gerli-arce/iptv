// Decoracion de Halloween: murcielagos que cruzan la pantalla. Solo aparece en esas fechas y se oculta si la persona
// pidio menos animaciones.

export function isHalloweenSeason(date = new Date()) {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 9 && day >= 15) || (month === 10 && day <= 2);
}

// top: altura; size: ancho en px; fly: segundos que tarda en cruzar; bob: ritmo del vaiven; offset: adelanto para que
// al abrir ya esten repartidos; reverse: vuela de derecha a izquierda.
const BATS = [
  { top: "7%", size: 78, fly: 19, bob: 3.2, offset: -2, opacity: 1 },
  { top: "22%", size: 44, fly: 27, bob: 2.4, offset: -14, opacity: 0.75, reverse: true },
  { top: "41%", size: 58, fly: 23, bob: 3.8, offset: -9, opacity: 0.9 },
  { top: "63%", size: 38, fly: 31, bob: 2.1, offset: -21, opacity: 0.65, reverse: true },
  { top: "78%", size: 68, fly: 21, bob: 3.5, offset: -6, opacity: 0.95 },
  { top: "14%", size: 32, fly: 35, bob: 1.9, offset: -28, opacity: 0.6 },
];

// Mitad izquierda del murcielago; la derecha es su espejo.
const WING = "M50 14 C48.5 14 47.5 15.5 47 18 L45.5 11.5 L43 19.5 C37 15.5 27 14 13 19 C7 21.5 3 26 1 31 C7 28.5 13 29 17.5 33.5 C20 30.5 24.5 29.5 28.5 32.5 C30.5 35.5 33.5 34 36.5 38 C38.5 34 43 33 46.5 37 C47.5 41 48.5 44 50 46 Z";

function Bat({ bat }) {
  return (
    <div
      className="absolute left-0"
      style={{ top: bat.top, animation: `fpBatFly ${bat.fly}s linear ${bat.offset}s infinite${bat.reverse ? " reverse" : ""}` }}
    >
      <div style={{ animation: `fpBatBob ${bat.bob}s ease-in-out infinite`, opacity: bat.opacity }}>
        <svg
          viewBox="0 0 100 50"
          width={bat.size}
          height={bat.size / 2}
          className="drop-shadow-[0_0_9px_rgba(255,122,43,0.7)]"
          style={{ animation: "fpBatFlap 0.42s ease-in-out infinite", transform: bat.reverse ? "scaleX(-1)" : undefined }}
        >
          <g fill="#1a1222" stroke="rgba(255,150,70,0.55)" strokeWidth="0.9" strokeLinejoin="round">
            <path d={WING} />
            <path d={WING} transform="translate(100 0) scale(-1 1)" />
          </g>
          <circle cx="46.2" cy="19.5" r="0.9" fill="#ff7a2b" />
          <circle cx="53.8" cy="19.5" r="0.9" fill="#ff7a2b" />
        </svg>
      </div>
    </div>
  );
}

// fixed: cubre toda la ventana y sigue visible al hacer scroll (landing). Sin fixed llena el contenedor que la contiene.
export function HalloweenBats({ className = "", fixed = false }) {
  if (!isHalloweenSeason()) return null;
  return (
    <div aria-hidden="true" className={`pointer-events-none ${fixed ? "fixed z-30" : "absolute"} inset-0 overflow-hidden motion-reduce:hidden ${className}`}>
      {BATS.map((bat, i) => (
        <Bat key={i} bat={bat} />
      ))}
    </div>
  );
}
