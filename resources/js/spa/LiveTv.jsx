import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { ChevronLeft, ChevronRight, Play, RotateCcw, Tv, VolumeX, X } from "lucide-react";
import { proxiedImageUrl } from "./helpers";

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
      className="group text-left outline-none"
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

function LivePlayer({ channel, categoryName, getStream, onClose, onStep }) {
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
      .then(({ url }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls(HLS_CONFIG);
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);
          let retries = 0;
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data?.fatal || cancelled) return;
            // Ante un corte de red o de decodificacion se reintenta unas veces antes de mostrar el error.
            if (retries < 3 && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              retries += 1;
              hls.startLoad();
            } else if (retries < 3 && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              retries += 1;
              hls.recoverMediaError();
            } else {
              setStatus("error");
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
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

  const active = activeId == null ? null : filtered.find((c) => c.stream_id === activeId) || visible.find((c) => c.stream_id === activeId) || null;
  const categoryName = (channel) => categories.find((cat) => String(cat.category_id) === String(channel?.category_id))?.category_name;

  const step = (delta) => {
    const list = filtered.length ? filtered : visible;
    const index = list.findIndex((c) => c.stream_id === activeId);
    if (index === -1 || !list.length) return;
    setActiveId(list[(index + delta + list.length) % list.length].stream_id);
  };

  return (
    <section className="space-y-6 px-4 pb-12 pt-24 md:px-10 md:pt-28">
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">TV en vivo</h1>
        {!loading && !error ? <span className="text-sm text-zinc-500">{filtered.length} canales</span> : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-8 text-white">
          <p className="text-lg font-bold">No se pudieron cargar los canales</p>
          <button onClick={onRetry} className="mt-4 rounded-lg bg-coral px-5 py-2.5 font-semibold text-white transition hover:bg-coral-soft">
            Reintentar
          </button>
        </div>
      ) : null}

      {!error && visibleCategories.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1 fp-no-scrollbar">
          {[{ category_id: "all", category_name: "Todos", count: visible.length }, ...visibleCategories].map((cat) => {
            const active = String(categoryId) === String(cat.category_id);
            return (
              <button
                key={cat.category_id}
                onClick={() => setCategoryId(cat.category_id)}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition duration-200 ${
                  active ? "border-white bg-white text-black" : "border-white/15 text-zinc-300 hover:border-white/40 hover:text-white"
                }`}
              >
                {cat.category_name}
                <span className={`ml-1.5 text-xs ${active ? "text-black/50" : "text-zinc-500"}`}>{cat.count}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="fp-skeleton aspect-video rounded-lg" />
          ))}
        </div>
      ) : null}

      {!loading && !error && !filtered.length ? (
        <p className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-zinc-400">
          {q ? "No encontramos canales con ese nombre." : "No hay canales disponibles por ahora."}
        </p>
      ) : null}

      {!loading && !error && filtered.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((channel) => (
            <ChannelCard key={channel.stream_id} channel={channel} onOpen={(c) => setActiveId(c.stream_id)} />
          ))}
        </div>
      ) : null}

      {active ? <LivePlayer channel={active} categoryName={categoryName(active)} getStream={getStream} onClose={() => setActiveId(null)} onStep={step} /> : null}
    </section>
  );
}
