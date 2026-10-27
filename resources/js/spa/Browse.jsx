import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Play } from "lucide-react";

const PLACEHOLDER_HUES = [352, 14, 28, 268, 222, 190];

function placeholderStyle(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  const hue = PLACEHOLDER_HUES[hash % PLACEHOLDER_HUES.length];
  return { background: `linear-gradient(155deg, hsl(${hue} 55% 30%), hsl(${(hue + 40) % 360} 50% 10%))` };
}

const isExternal = (href) => Boolean(href && /^https?:\/\//i.test(href));

export function Billboard({ slides = [] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (count < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 8000);
    return () => clearInterval(id);
  }, [count, index]);

  if (!count) return null;
  const slide = slides[Math.min(index, count - 1)];
  const external = isExternal(slide.href);

  return (
    <section className="relative isolate min-h-[420px] overflow-hidden sm:min-h-[520px] md:min-h-[640px] lg:min-h-[72vh]">
      <div key={slide.id} className="absolute inset-0 animate-[fpFade_0.8s_ease-out]">
        {slide.image ? (
          <img key={slide.image} src={slide.image} alt="" className="h-full w-full animate-[fpFade_0.9s_ease-out] object-cover object-center" />
        ) : slide.pending ? (
          // Se esta buscando la imagen horizontal: fondo neutro en vez de mostrar el poster y cambiarlo despues.
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_70%_40%,#1b1b24_0%,#0b0b10_70%)]" />
        ) : slide.poster ? (
          <>
            <img src={slide.poster} alt="" className="h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
            <img
              src={slide.poster}
              alt=""
              className="absolute right-4 top-24 h-[36%] rounded-xl object-cover shadow-[0_30px_80px_rgba(0,0,0,0.7)] sm:h-[46%] md:right-[8%] md:top-1/2 md:h-[78%] md:-translate-y-1/2"
            />
          </>
        ) : (
          <div className="h-full w-full" style={placeholderStyle(slide.title)} />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#08080b] via-[#08080b]/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#08080b] via-[#08080b]/70 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[420px] w-full max-w-[1800px] flex-col justify-end px-4 pb-14 pt-28 sm:min-h-[520px] md:min-h-[640px] md:px-10 md:pb-20 lg:min-h-[72vh]">
        <div key={`t-${slide.id}`} className="max-w-2xl animate-[fpRise_0.7s_ease-out] space-y-4">
          {slide.badge ? (
            <span className="inline-flex rounded-md border border-coral/30 bg-coral/10 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-coral-soft">
              {slide.badge}
            </span>
          ) : null}
          <h2 className="text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)] sm:text-5xl md:text-6xl">
            {slide.title}
          </h2>
          {slide.subtitle ? <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-zinc-200 md:text-base">{slide.subtitle}</p> : null}
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={slide.href || "#"}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-zinc-200 md:text-base"
            >
              <Play className="size-5" fill="currentColor" />
              Ver ahora
            </a>
            <a
              href={slide.href || "#"}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 md:text-base"
            >
              <Info className="size-5" />
              Mas informacion
            </a>
          </div>
        </div>

        {count > 1 ? (
          <div className="absolute bottom-6 right-4 flex gap-2 md:bottom-12 md:right-10">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                aria-label={`Destacado ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-3 bg-white/35 hover:bg-white/60"}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function Row({ title, subtitle, children }) {
  const scroller = useRef(null);

  const scrollBy = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="group/row space-y-3">
      <div className="flex items-baseline gap-3 px-4 md:px-10">
        <h3 className="text-lg font-bold tracking-[-0.01em] text-white md:text-xl">{title}</h3>
        {subtitle ? <span className="text-xs text-zinc-500">{subtitle}</span> : null}
      </div>
      <div className="relative">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Anterior"
          className="absolute left-0 top-0 z-10 hidden h-full w-12 items-center justify-center bg-gradient-to-r from-[#08080b] to-transparent text-white opacity-0 transition group-hover/row:opacity-100 md:flex"
        >
          <ChevronLeft className="size-8" />
        </button>
        <div ref={scroller} className="fp-no-scrollbar flex snap-x scroll-pl-4 gap-2.5 overflow-x-auto scroll-smooth px-4 pb-2 md:scroll-pl-10 md:gap-3 md:px-10">
          {children}
        </div>
        <button
          onClick={() => scrollBy(1)}
          aria-label="Siguiente"
          className="absolute right-0 top-0 z-10 hidden h-full w-12 items-center justify-center bg-gradient-to-l from-[#08080b] to-transparent text-white opacity-0 transition group-hover/row:opacity-100 md:flex"
        >
          <ChevronRight className="size-8" />
        </button>
      </div>
    </section>
  );
}

export function LandscapeCard({ title, image, href, badge, label }) {
  const external = isExternal(href);
  return (
    <a
      href={href || "#"}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group relative aspect-video w-[250px] shrink-0 snap-start overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10 transition duration-300 hover:z-10 hover:scale-[1.04] hover:ring-white/30 md:w-[320px]"
    >
      {image ? (
        <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={placeholderStyle(title)} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      {badge ? (
        <span className="absolute left-2.5 top-2.5 rounded bg-coral px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">{badge}</span>
      ) : null}
      <span className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full bg-white/90 text-black opacity-0 transition group-hover:opacity-100">
        <Play className="size-4" fill="currentColor" />
      </span>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-1 text-sm font-semibold text-white">{title}</p>
        {label ? <p className="mt-0.5 text-[11px] text-zinc-400">{label}</p> : null}
      </div>
    </a>
  );
}

export function PosterCard({ title, image, href, meta, className = "w-[130px] shrink-0 snap-start md:w-[168px]" }) {
  return (
    <a href={href || "#"} className={`group block ${className}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/35 group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
        {image ? (
          <img src={image} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-3 text-center" style={placeholderStyle(title)}>
            <span className="line-clamp-4 text-sm font-bold text-white/90">{title}</span>
          </div>
        )}
        <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          <span className="grid size-11 place-items-center rounded-full bg-white text-black">
            <Play className="size-5" fill="currentColor" />
          </span>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-[13px] font-medium text-zinc-100">{title}</p>
      {meta ? <p className="text-[11px] text-zinc-500">{meta}</p> : null}
    </a>
  );
}
