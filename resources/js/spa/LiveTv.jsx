import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { ChevronLeft, ChevronRight, Play, RotateCcw, Tv, VolumeX, X } from "lucide-react";
import { proxiedImageUrl } from "./helpers";
import { Row } from "./Browse";

const HLS_CONFIG = {
  enableWorker: true,
  lowLatencyMode: false,
  liveSyncDurationCount: 3,
  liveMaxLatencyDurationCount: 8,
  maxBufferLength: 20,
  manifestLoadingMaxRetry: 2,
  levelLoadingMaxRetry: 3,
  fragLoadingMaxRetry: 4,
};

function LiveBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded bg-coral px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white ${className}`}>
      <span className="size-1.5 animate-pulse rounded-full bg-white" />
      En vivo
    </span>
  );
}

function ChannelCard({ channel, onOpen }) {
  const logo = proxiedImageUrl(channel.stream_icon);
  return (
    <button
      onClick={() => onOpen(channel)}
      className="group block w-full text-left outline-none"
      aria-label={`Ver ${channel.name} en vivo`}
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-[#3b3b45] to-[#24242c] ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/35 group-focus-visible:ring-coral group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
        {logo ? (
          <img src={logo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-contain p-5" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <Tv className="size-8 text-zinc-600" />
          </div>
        )}
        <LiveBadge className="absolute left-2 top-2" />
        <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition group-hover:opacity-100">
          <span className="grid size-11 place-items-center rounded-full bg-white text-black">
            <Play className="size-5" fill="currentColor" />
          </span>
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-[13px] font-medium text-zinc-100">{channel.name}</p>
    </button>
  );
}

export function LivePlayer({ channel, categoryName, getStream, onClose, onStep }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | playing | error | tap
  const [silent, setSilent] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onStep(1);
      if (event.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, onStep]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    let hls = null;
    let cancelled = false;
    let silenceTimer = null;
    setStatus("loading");
    setSilent(false);

    const tryPlay = () => {
      const result = video.play();
      if (result && typeof result.catch === "function") result.catch(() => !cancelled && setStatus("tap"));
    };

    const onPlaying = () => {
      if (cancelled) return;
      setStatus("playing");
      clearTimeout(silenceTimer);
      // Si el video avanza pero el navegador no decodifica nada de audio, se avisa.
      silenceTimer = setTimeout(() => {
        if (cancelled || video.paused || video.muted || video.volume === 0) return;
        if (typeof video.webkitAudioDecodedByteCount === "number" && video.webkitAudioDecodedByteCount === 0) setSilent(true);
      }, 6000);
    };
    video.addEventListener("playing", onPlaying);

    getStream(channel.stream_id)
      .then(({ url, fallback_url: fallbackUrl }) => {
        if (cancelled) return;
        // Primero la direccion directa del panel (si la hay) y, si falla, la que pasa por el proxy de la app.
        const sources = [url, fallbackUrl].filter(Boolean);
        if (Hls.isSupported()) {
          const start = (index) => {
            if (hls) hls.destroy();
            const instance = new Hls(HLS_CONFIG);
            hls = instance;
            instance.loadSource(sources[index]);
            instance.attachMedia(video);
            instance.on(Hls.Events.MANIFEST_PARSED, tryPlay);
            let retries = 0;
            instance.on(Hls.Events.ERROR, (_event, data) => {
              if (!data?.fatal || cancelled) return;
              if (index + 1 < sources.length) {
                start(index + 1);
                return;
              }
              // Ante un corte de red o de decodificacion se reintenta unas veces antes de mostrar el error.
              if (retries < 3 && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                retries += 1;
                instance.startLoad();
              } else if (retries < 3 && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                retries += 1;
                instance.recoverMediaError();
              } else {
                setStatus("error");
              }
            });
          };
          start(0);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = sources[0];
          tryPlay();
        } else {
          setStatus("error");
        }
      })
      .catch(() => !cancelled && setStatus("error"));

    return () => {
      cancelled = true;
      clearTimeout(silenceTimer);
      video.removeEventListener("playing", onPlaying);
      if (hls) hls.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [channel.stream_id, attempt, getStream]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-sm" role="dialog" aria-label={channel.name}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <LiveBadge />
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-white md:text-lg">{channel.name}</h2>
            {categoryName ? <p className="truncate text-xs text-zinc-500">{categoryName}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onStep(-1)} aria-label="Canal anterior" className="grid size-9 place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:border-white/30 hover:text-white">
            <ChevronLeft className="size-5" />
          </button>
          <button onClick={() => onStep(1)} aria-label="Canal siguiente" className="grid size-9 place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:border-white/30 hover:text-white">
            <ChevronRight className="size-5" />
          </button>
          <button onClick={onClose} aria-label="Cerrar" className="ml-1 grid size-9 place-items-center rounded-lg bg-white/10 text-white transition hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="relative mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 items-center justify-center px-0 pb-4 md:px-8 md:pb-8">
        <div className="relative aspect-video max-h-full w-full overflow-hidden bg-black md:rounded-xl md:ring-1 md:ring-white/10">
          <video ref={videoRef} controls autoPlay playsInline className="h-full w-full bg-black object-contain" />

          {status === "loading" ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/50">
              <div className="flex flex-col items-center gap-3 text-sm text-zinc-300">
                <span className="size-9 animate-spin rounded-full border-2 border-white/20 border-t-coral" />
                Conectando con el canal...
              </div>
            </div>
          ) : null}

          {status === "tap" ? (
            <button onClick={() => videoRef.current?.play()} className="absolute inset-0 grid place-items-center bg-black/50">
              <span className="grid size-16 place-items-center rounded-full bg-white text-black">
                <Play className="size-7" fill="currentColor" />
              </span>
            </button>
          ) : null}

          {status === "error" ? (
            <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
              <div className="space-y-4">
                <p className="text-base font-semibold text-white">Este canal no está disponible en este momento</p>
                <p className="text-sm text-zinc-400">Prueba de nuevo en unos segundos o elige otro canal.</p>
                <button onClick={() => setAttempt((n) => n + 1)} className="inline-flex items-center gap-2 rounded-lg bg-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-coral-soft">
                  <RotateCcw className="size-4" />
                  Reintentar
                </button>
              </div>
            </div>
          ) : null}

          {silent ? (
            <div className="absolute inset-x-3 top-3 flex items-start gap-2.5 rounded-lg border border-amber-400/30 bg-black/80 px-3 py-2.5 text-xs text-amber-100 backdrop-blur">
              <VolumeX className="mt-0.5 size-4 shrink-0" />
              Este canal se ve, pero su audio no es compatible con el navegador. Para escucharlo usa la app.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Canales que la gente mas ve, en el orden en que se muestran en el inicio.
const FEATURED_CHANNELS = [
  "AMERICA TV HD",
  "PANAMERICANA HD",
  "EXITOSA HD",
  "CANAL N HD",
  "DSPORTS HD",
  "DSPORTS+ HD",
  "ESPN PREMIUN HD",
  "LIGA 1 MAX HD",
  "LIGA 1 HD",
  "CLARO SPORT HD",
  "TNT SPORT PREMIUM HD",
  "MOVISTAR DEPORTES HD",
  "HBO HD",
  "CINECANAL HD",
  "DISCOVERY CHANNEL HD",
  "CNN ESPAÑOL HD",
  "NATIONAL GEOGRAPHIC HD",
  "TNT HD",
];

export function pickFeaturedChannels(channels = []) {
  const byName = new Map(channels.map((c) => [String(c.name).trim().toUpperCase(), c]));
  return FEATURED_CHANNELS.map((name) => byName.get(name)).filter(Boolean);
}

// Fila "Canales recomendados" del inicio: abre el canal en el mismo reproductor de TV en vivo.
export function FeaturedChannels({ channels = [], categories = [], getStream }) {
  const [activeId, setActiveId] = useState(null);
  const featured = useMemo(() => pickFeaturedChannels(channels), [channels]);
  if (!featured.length) return null;

  const active = activeId == null ? null : featured.find((c) => c.stream_id === activeId) || null;
  const step = (delta) => {
    const index = featured.findIndex((c) => c.stream_id === activeId);
    if (index === -1) return;
    setActiveId(featured[(index + delta + featured.length) % featured.length].stream_id);
  };
  const categoryName = (channel) => categories.find((cat) => String(cat.category_id) === String(channel?.category_id))?.category_name;

  return (
    <>
      <Row title="Canales recomendados" subtitle="TV en vivo">
        {featured.map((channel) => (
          <div key={channel.stream_id} className="w-[190px] shrink-0 snap-start md:w-[240px]">
            <ChannelCard channel={channel} onOpen={(c) => setActiveId(c.stream_id)} />
          </div>
        ))}
      </Row>
      {active ? <LivePlayer channel={active} categoryName={categoryName(active)} getStream={getStream} onClose={() => setActiveId(null)} onStep={step} /> : null}
    </>
  );
}

function ChannelRow({ category, channels, onOpen, onSeeAll }) {
  const scroller = useRef(null);
  const scrollBy = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="group/row space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-lg font-bold tracking-[-0.01em] text-white md:text-xl">{category.category_name}</h2>
          <span className="font-mono text-xs text-zinc-500">{channels.length}</span>
        </div>
        <button onClick={onSeeAll} className="flex items-center gap-0.5 text-xs font-medium text-zinc-400 transition hover:text-white">
          Ver todos
          <ChevronRight className="size-3.5" />
        </button>
      </div>
      <div className="relative">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Anterior"
          className="absolute -left-3 top-0 z-10 hidden h-[calc(100%-2.25rem)] w-10 items-center justify-center bg-gradient-to-r from-[#08080b] to-transparent text-white opacity-0 transition group-hover/row:opacity-100 md:flex"
        >
          <ChevronLeft className="size-7" />
        </button>
        <div ref={scroller} className="fp-no-scrollbar -mx-4 flex snap-x scroll-pl-4 gap-3 overflow-x-auto scroll-smooth px-4 pb-1 md:mx-0 md:scroll-pl-0 md:px-0">
          {channels.map((channel) => (
            <div key={channel.stream_id} className="w-[168px] shrink-0 snap-start md:w-[208px]">
              <ChannelCard channel={channel} onOpen={onOpen} />
            </div>
          ))}
        </div>
        <button
          onClick={() => scrollBy(1)}
          aria-label="Siguiente"
          className="absolute -right-3 top-0 z-10 hidden h-[calc(100%-2.25rem)] w-10 items-center justify-center bg-gradient-to-l from-[#08080b] to-transparent text-white opacity-0 transition group-hover/row:opacity-100 md:flex"
        >
          <ChevronRight className="size-7" />
        </button>
      </div>
    </section>
  );
}

function CategoryNav({ items, value, onChange }) {
  return (
    <>
      {/* Escritorio: lista vertical fija a la izquierda */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav className="fp-no-scrollbar sticky top-24 max-h-[calc(100vh-8rem)] space-y-0.5 overflow-y-auto pr-2" aria-label="Categorias">
          <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Categorias</p>
          {items.map((cat) => {
            const active = String(value) === String(cat.category_id);
            return (
              <button
                key={cat.category_id}
                onClick={() => onChange(cat.category_id)}
                className={`relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  active ? "bg-white/[0.08] font-semibold text-white" : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-coral" /> : null}
                <span className="truncate">{cat.category_name}</span>
                <span className={`font-mono text-xs ${active ? "text-zinc-300" : "text-zinc-600"}`}>{cat.count}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Movil y tablet: fila deslizable que se queda fija bajo el menu */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-white/[0.06] bg-[#08080b]/90 backdrop-blur-xl md:top-[72px] md:-mx-10 lg:hidden">
        <div className="fp-no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2.5 md:px-10">
          {items.map((cat) => {
            const active = String(value) === String(cat.category_id);
            return (
              <button
                key={cat.category_id}
                onClick={() => onChange(cat.category_id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
                  active ? "bg-white text-black" : "bg-white/[0.06] text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {cat.category_name}
                <span className={`ml-1.5 font-mono text-[11px] ${active ? "text-black/50" : "text-zinc-500"}`}>{cat.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function LiveTv({ channels = [], categories = [], loading, error, searchQuery = "", hideUnplayable = true, getStream, onRetry }) {
  const [categoryId, setCategoryId] = useState("all");
  const [activeId, setActiveId] = useState(null);
  const q = searchQuery.trim().toLowerCase();

  // Solo se muestran los canales que se reproducen en el navegador (web_playable !== false).
  const visible = useMemo(() => channels.filter((c) => !(hideUnplayable && c.web_playable === false)), [channels, hideUnplayable]);

  const visibleCategories = useMemo(() => {
    const counts = new Map();
    visible.forEach((c) => counts.set(String(c.category_id), (counts.get(String(c.category_id)) || 0) + 1));
    return categories.filter((cat) => counts.has(String(cat.category_id))).map((cat) => ({ ...cat, count: counts.get(String(cat.category_id)) }));
  }, [visible, categories]);

  useEffect(() => {
    if (categoryId !== "all" && !visibleCategories.some((cat) => String(cat.category_id) === String(categoryId))) setCategoryId("all");
  }, [visibleCategories, categoryId]);

  const filtered = useMemo(
    () => visible.filter((c) => (categoryId === "all" || String(c.category_id) === String(categoryId)) && (!q || String(c.name).toLowerCase().includes(q))),
    [visible, categoryId, q],
  );

  // En "Todos" (sin busqueda) los canales se muestran en una fila por categoria.
  const grouped = categoryId === "all" && !q;
  const groups = useMemo(() => {
    if (!grouped) return [];
    return visibleCategories
      .map((cat) => ({ category: cat, channels: visible.filter((c) => String(c.category_id) === String(cat.category_id)) }))
      .filter((g) => g.channels.length);
  }, [grouped, visibleCategories, visible]);

  // Orden en pantalla, para que "anterior / siguiente" del reproductor siga lo que se ve.
  const ordered = useMemo(() => (grouped ? groups.flatMap((g) => g.channels) : filtered), [grouped, groups, filtered]);

  const active = activeId == null ? null : visible.find((c) => c.stream_id === activeId) || null;
  const categoryName = (channel) => categories.find((cat) => String(cat.category_id) === String(channel?.category_id))?.category_name;
  const currentCategory = visibleCategories.find((cat) => String(cat.category_id) === String(categoryId));

  const step = (delta) => {
    const list = ordered.length ? ordered : visible;
    const index = list.findIndex((c) => c.stream_id === activeId);
    if (index === -1 || !list.length) return;
    setActiveId(list[(index + delta + list.length) % list.length].stream_id);
  };

  const navItems = [{ category_id: "all", category_name: "Todos", count: visible.length }, ...visibleCategories];
  const heading = q ? `Resultados para "${searchQuery.trim()}"` : currentCategory ? currentCategory.category_name : "TV en vivo";
  const total = grouped ? visible.length : filtered.length;

  return (
    <section className="px-4 pb-12 pt-24 md:px-10 md:pt-28">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">{heading}</h1>
        {!loading && !error ? <span className="text-sm text-zinc-500">{total} canales</span> : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-8 text-white">
          <p className="text-lg font-bold">No se pudieron cargar los canales</p>
          <button onClick={onRetry} className="mt-4 rounded-lg bg-coral px-5 py-2.5 font-semibold text-white transition hover:bg-coral-soft">
            Reintentar
          </button>
        </div>
      ) : null}

      {!error ? (
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {!loading && visibleCategories.length ? <CategoryNav items={navItems} value={categoryId} onChange={setCategoryId} /> : null}

          <div className="min-w-0 flex-1 space-y-8 pt-4 lg:pt-0">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="fp-skeleton aspect-video rounded-lg" />
                ))}
              </div>
            ) : null}

            {!loading && !filtered.length ? (
              <p className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-zinc-400">
                {q ? "No encontramos canales con ese nombre." : "No hay canales disponibles por ahora."}
              </p>
            ) : null}

            {!loading && grouped
              ? groups.map((g) => (
                  <ChannelRow key={g.category.category_id} category={g.category} channels={g.channels} onOpen={(c) => setActiveId(c.stream_id)} onSeeAll={() => setCategoryId(g.category.category_id)} />
                ))
              : null}

            {!loading && !grouped && filtered.length ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 xl:grid-cols-5">
                {filtered.map((channel) => (
                  <ChannelCard key={channel.stream_id} channel={channel} onOpen={(c) => setActiveId(c.stream_id)} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {active ? <LivePlayer channel={active} categoryName={categoryName(active)} getStream={getStream} onClose={() => setActiveId(null)} onStep={step} /> : null}
    </section>
  );
}
