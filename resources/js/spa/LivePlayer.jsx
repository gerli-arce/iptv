import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Hls from "hls.js";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, PictureInPicture2, Play, Radio, RotateCcw, Tv, Volume2, VolumeX, X } from "lucide-react";
import { proxiedImageUrl } from "./helpers";
import { HalloweenBats } from "./Halloween";
import { ScrollStrip } from "./Catalog";
import { isIos } from "./pwa";

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

export function LiveBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded bg-coral px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white ${className}`}>
      <span className="size-1.5 animate-pulse rounded-full bg-white" />
      En vivo
    </span>
  );
}

function IconButton({ label, onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid size-9 shrink-0 place-items-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral ${className}`}
    >
      {children}
    </button>
  );
}

// Reproductor de TV en vivo. Los controles son propios (el video no usa los del navegador), asi el aspecto es el de la
// web y hay un solo indicador de carga. Los canales de "related" se muestran debajo para cambiar sin cerrar.
export function LivePlayer({ channel, categoryName, getStream, onClose, onStep, related = [], onSelect }) {
  const videoRef = useRef(null);
  const frameRef = useRef(null);
  const hlsRef = useRef(null);
  const hideTimer = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | playing | error | tap
  const [buffering, setBuffering] = useState(false);
  const [silent, setSilent] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFull, setIsFull] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [behindLive, setBehindLive] = useState(false);
  const logo = proxiedImageUrl(channel.stream_icon);
  const canPip = typeof document !== "undefined" && document.pictureInPictureEnabled;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.6;
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else if (frameRef.current?.requestFullscreen) frameRef.current.requestFullscreen().catch(() => {});
    else if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iPhone: solo el video puede ir a pantalla completa
  };

  const togglePip = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture?.().catch(() => {});
    else video.requestPictureInPicture?.().catch(() => {});
  };

  const goLive = () => {
    const video = videoRef.current;
    if (!video) return;
    const end = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : video.currentTime;
    video.currentTime = hlsRef.current?.liveSyncPosition ?? Math.max(0, end - 2);
    video.play().catch(() => {});
  };

  // Los controles se esconden solos tras unos segundos sin mover el raton mientras se reproduce.
  const wakeControls = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2800);
  };

  useEffect(() => {
    const onKey = (event) => {
      const onInput = event.target instanceof HTMLInputElement;
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight" && !onInput) onStep(1);
      else if (event.key === "ArrowLeft" && !onInput) onStep(-1);
      else if ((event.key === " " || event.key.toLowerCase() === "k") && !onInput) {
        event.preventDefault();
        togglePlay();
      } else if (event.key.toLowerCase() === "m" && !onInput) toggleMute();
      else if (event.key.toLowerCase() === "f" && !onInput) toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      clearTimeout(hideTimer.current);
    };
  }, [onClose, onStep]);

  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    let hls = null;
    let cancelled = false;
    let silenceTimer = null;
    let nativeTimer = null;
    let nativeFail = null;
    setStatus("loading");
    setSilent(false);
    setBuffering(false);

    const tryPlay = () => {
      const result = video.play();
      if (result && typeof result.catch === "function") result.catch(() => !cancelled && setStatus("tap"));
    };

    const onPlaying = () => {
      if (cancelled) return;
      setStatus("playing");
      setBuffering(false);
      clearTimeout(silenceTimer);
      // Si el video avanza pero el navegador no decodifica nada de audio, se avisa.
      silenceTimer = setTimeout(() => {
        if (cancelled || video.paused || video.muted || video.volume === 0) return;
        if (typeof video.webkitAudioDecodedByteCount === "number" && video.webkitAudioDecodedByteCount === 0) setSilent(true);
      }, 6000);
    };
    const onWaiting = () => !cancelled && setBuffering(true);
    const onPlayState = () => setPaused(video.paused);
    const onVolume = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };
    const onTime = () => {
      const end = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : video.currentTime;
      const live = hls?.liveSyncPosition ?? end;
      setBehindLive(live - video.currentTime > 15);
    };
    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("play", onPlayState);
    video.addEventListener("pause", onPlayState);
    video.addEventListener("volumechange", onVolume);
    video.addEventListener("timeupdate", onTime);
    // Con el reproductor nativo (iPhone) los fallos llegan como evento del video.
    const onError = () => nativeFail && nativeFail();
    const onLoaded = () => clearTimeout(nativeTimer);
    video.addEventListener("error", onError);
    video.addEventListener("loadeddata", onLoaded);
    onVolume();

    getStream(channel.stream_id)
      .then(({ url, fallback_url: fallbackUrl }) => {
        if (cancelled) return;
        // Primero la direccion directa del panel (si la hay) y, si falla, la que pasa por el proxy de la app.
        const sources = [url, fallbackUrl].filter(Boolean);
        const canNative = Boolean(video.canPlayType("application/vnd.apple.mpegurl"));

        // iPhone/iPad: Safari reproduce HLS por si mismo y es mas fiable que hls.js (que necesita funciones que alli
        // son limitadas). Si una fuente falla o no arranca en 15 s, se prueba la siguiente.
        const startNative = (index) => {
          clearTimeout(nativeTimer);
          const failOver = () => {
            if (cancelled) return;
            if (index + 1 < sources.length) startNative(index + 1);
            else setStatus("error");
          };
          nativeFail = failOver;
          video.src = sources[index];
          video.load();
          tryPlay();
          nativeTimer = setTimeout(() => video.readyState < 2 && failOver(), 15000);
        };

        if (isIos() && canNative) {
          startNative(0);
        } else if (Hls.isSupported()) {
          const start = (index) => {
            if (hls) hls.destroy();
            const instance = new Hls(HLS_CONFIG);
            hls = instance;
            hlsRef.current = instance;
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
        } else if (canNative) {
          startNative(0);
        } else {
          setStatus("error");
        }
      })
      .catch(() => !cancelled && setStatus("error"));

    return () => {
      cancelled = true;
      clearTimeout(silenceTimer);
      clearTimeout(nativeTimer);
      nativeFail = null;
      video.removeEventListener("error", onError);
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("play", onPlayState);
      video.removeEventListener("pause", onPlayState);
      video.removeEventListener("volumechange", onVolume);
      video.removeEventListener("timeupdate", onTime);
      if (hls) hls.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [channel.stream_id, attempt, getStream]);

  const controlsVisible = showControls || paused || status !== "playing";
  const frameWidth = `calc((100dvh - ${related.length ? "18.5rem" : "10rem"}) * 16 / 9)`;

  // Se dibuja directamente en el body para quedar por encima del menu sin importar donde se abra.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-[#07070b] [background-image:radial-gradient(ellipse_70%_55%_at_15%_0%,rgba(255,99,99,0.16),transparent_60%),radial-gradient(ellipse_60%_50%_at_90%_100%,rgba(255,122,43,0.12),transparent_60%)]"
      role="dialog"
      aria-label={channel.name}
    >
      <HalloweenBats />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-1 flex-col px-3 pb-6 pt-3 md:px-8 md:pt-5">
        <header className="mb-3 flex items-center justify-between gap-3 md:mb-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[0.07] ring-1 ring-white/10">
              {logo ? <img src={logo} alt="" className="size-full object-contain p-1.5" /> : <Tv className="size-5 text-zinc-500" />}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-[-0.01em] text-white md:text-xl">{channel.name}</h2>
              <p className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-coral">
                  <span className="size-1.5 animate-pulse rounded-full bg-coral" />
                  En vivo
                </span>
                {categoryName ? <span className="truncate">{categoryName}</span> : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => onStep(-1)} aria-label="Canal anterior" title="Canal anterior (←)" className="grid size-10 place-items-center rounded-xl bg-white/[0.07] text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/15 hover:text-white">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => onStep(1)} aria-label="Canal siguiente" title="Canal siguiente (→)" className="grid size-10 place-items-center rounded-xl bg-white/[0.07] text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/15 hover:text-white">
              <ChevronRight className="size-5" />
            </button>
            <button onClick={onClose} aria-label="Cerrar" title="Cerrar (Esc)" className="ml-1 grid size-10 place-items-center rounded-xl bg-coral text-white shadow-[0_8px_24px_rgba(255,99,99,0.35)] transition hover:bg-coral-soft">
              <X className="size-5" />
            </button>
          </div>
        </header>

        <div
          ref={frameRef}
          onMouseMove={wakeControls}
          onMouseLeave={() => status === "playing" && setShowControls(false)}
          style={isFull ? undefined : { maxWidth: frameWidth }}
          className={`group/player relative mx-auto aspect-video w-full overflow-hidden bg-black ${
            isFull ? "" : "rounded-2xl ring-1 ring-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.75),0_0_90px_rgba(255,99,99,0.14)]"
          } ${status === "playing" && !controlsVisible ? "cursor-none" : ""}`}
        >
          <video ref={videoRef} autoPlay playsInline onClick={togglePlay} onDoubleClick={toggleFullscreen} className="h-full w-full bg-black object-contain" />

          {/* Carga: un solo indicador con el logo del canal */}
          {status === "loading" || (buffering && status === "playing") ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/55">
              <div className="flex flex-col items-center gap-4">
                <div className="relative grid size-24 place-items-center">
                  <span className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-coral" />
                  <div className="grid size-16 place-items-center overflow-hidden rounded-2xl bg-white/[0.07]">
                    {logo ? <img src={logo} alt="" className="size-full object-contain p-2" /> : <Tv className="size-6 text-zinc-500" />}
                  </div>
                </div>
                {status === "loading" ? <p className="text-sm font-medium text-zinc-300">Conectando con el canal…</p> : null}
              </div>
            </div>
          ) : null}

          {status === "tap" ? (
            <button onClick={() => videoRef.current?.play().then(() => setStatus("playing")).catch(() => {})} className="absolute inset-0 grid place-items-center bg-black/55" aria-label="Reproducir">
              <span className="grid size-20 place-items-center rounded-full bg-white text-black shadow-[0_0_60px_rgba(255,99,99,0.5)]">
                <Play className="ml-1 size-8" fill="currentColor" />
              </span>
            </button>
          ) : null}

          {status === "error" ? (
            <div className="absolute inset-0 grid place-items-center bg-black/85 p-6 text-center">
              <div className="max-w-sm space-y-4">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/[0.07] ring-1 ring-white/10">
                  <Radio className="size-6 text-coral" />
                </div>
                <p className="text-lg font-bold text-white">Este canal no está disponible ahora</p>
                <p className="text-sm text-zinc-400">Prueba de nuevo en unos segundos o elige otro canal.</p>
                <div className="flex justify-center gap-2.5">
                  <button onClick={() => setAttempt((n) => n + 1)} className="inline-flex items-center gap-2 rounded-lg bg-coral px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-coral-soft">
                    <RotateCcw className="size-4" />
                    Reintentar
                  </button>
                  <button onClick={() => onStep(1)} className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                    Otro canal
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {silent ? (
            <div className="absolute inset-x-3 top-3 flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-black/80 px-3.5 py-2.5 text-xs text-amber-100 backdrop-blur">
              <VolumeX className="mt-0.5 size-4 shrink-0" />
              Este canal se ve, pero su audio no es compatible con el navegador. Para escucharlo usa la app.
            </div>
          ) : null}

          {/* Controles */}
          <div
            className={`absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300 md:px-4 ${
              controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <IconButton label={paused ? "Reproducir (K)" : "Pausar (K)"} onClick={togglePlay}>
              {paused ? <Play className="size-5" fill="currentColor" /> : <Pause className="size-5" fill="currentColor" />}
            </IconButton>

            <div className="group/vol flex items-center">
              <IconButton label={muted || volume === 0 ? "Activar sonido (M)" : "Silenciar (M)"} onClick={toggleMute}>
                {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </IconButton>
              {isIos() ? null : (
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={muted ? 0 : volume}
                aria-label="Volumen"
                onChange={(event) => {
                  const video = videoRef.current;
                  if (!video) return;
                  video.volume = Number(event.target.value);
                  video.muted = Number(event.target.value) === 0;
                }}
                style={{ "--fp-fill": `${(muted ? 0 : volume) * 100}%` }}
                className="fp-range w-0 opacity-0 transition-all duration-200 group-hover/vol:ml-1 group-hover/vol:mr-2 group-hover/vol:w-20 group-hover/vol:opacity-100 focus:ml-1 focus:mr-2 focus:w-20 focus:opacity-100"
              />
              )}
            </div>

            {behindLive ? (
              <button onClick={goLive} className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-white/25 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white transition hover:border-coral hover:bg-coral/20">
                <span className="size-1.5 rounded-full bg-zinc-400" />
                Ir al directo
              </button>
            ) : (
              <span className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-coral/90 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                En vivo
              </span>
            )}

            <div className="ml-auto flex items-center gap-1">
              {canPip ? (
                <IconButton label="Imagen en imagen" onClick={togglePip} className="hidden sm:grid">
                  <PictureInPicture2 className="size-5" />
                </IconButton>
              ) : null}
              <IconButton label={isFull ? "Salir de pantalla completa (F)" : "Pantalla completa (F)"} onClick={toggleFullscreen}>
                {isFull ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
              </IconButton>
            </div>
          </div>
        </div>

        {related.length ? (
          <section className="mx-auto mt-5 w-full" style={{ maxWidth: frameWidth }}>
            <p className="mb-2.5 px-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">{categoryName ? `Más en ${categoryName}` : "Más canales"}</p>
            <ScrollStrip className="-mx-3 gap-2.5 px-3 pb-1 md:mx-0 md:px-0" arrowTop="2.4rem">
              {related.map((item) => {
                const itemLogo = proxiedImageUrl(item.stream_icon);
                return (
                  <button
                    key={item.stream_id}
                    onClick={() => onSelect?.(item)}
                    aria-label={`Ver ${item.name}`}
                    className="group w-[132px] shrink-0 snap-start text-left md:w-[150px]"
                  >
                    <div className="relative grid aspect-video place-items-center overflow-hidden rounded-lg bg-white/[0.06] ring-1 ring-white/10 transition group-hover:-translate-y-0.5 group-hover:ring-coral/60">
                      {itemLogo ? <img src={itemLogo} alt="" loading="lazy" className="size-full object-contain p-3" /> : <Tv className="size-5 text-zinc-600" />}
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-xs font-medium text-zinc-300 group-hover:text-white">{item.name}</p>
                  </button>
                );
              })}
            </ScrollStrip>
          </section>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
