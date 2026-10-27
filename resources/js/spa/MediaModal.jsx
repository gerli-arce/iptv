import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, Play, Star, User, X, Youtube } from "lucide-react";

const formatRuntime = (minutes) => {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
};

// "Muertos de amor S01E01" -> "" para usar "Capitulo 1" cuando el panel no trae un titulo propio.
const cleanEpisodeTitle = (title, number, seriesTitle) => {
  const cleaned = String(title || "").replace(/\s*S\d{1,2}\s*E\d{1,3}\s*$/i, "").trim();
  const sameAsSeries = cleaned.toLowerCase() === String(seriesTitle || "").trim().toLowerCase();
  return cleaned && cleaned.length > 1 && !/^\d+$/.test(cleaned) && !sameAsSeries ? cleaned : `Capítulo ${number}`;
};

function Chip({ children }) {
  return <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-xs text-zinc-300">{children}</span>;
}

function EpisodeRow({ seriesId, seriesTitle, episode, meta }) {
  const title = meta?.title || cleanEpisodeTitle(episode.title, episode.number, seriesTitle);
  const overview = meta?.overview || episode.overview;
  const still = meta?.still || episode.still;
  const runtime = meta?.runtime || episode.runtime;

  return (
    <a href={`/play/series/${seriesId}/${episode.id}`} className="group flex gap-3.5 rounded-xl p-2 transition hover:bg-white/[0.06] sm:gap-4">
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-zinc-800 ring-1 ring-white/10 sm:w-44">
        {still ? <img src={still} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid size-full place-items-center text-zinc-600"><Play className="size-6" /></div>}
        <div className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition group-hover:opacity-100">
          <span className="grid size-9 place-items-center rounded-full bg-white text-black">
            <Play className="ml-0.5 size-4" fill="currentColor" />
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-coral">{episode.number}</span>
          <h4 className="truncate text-sm font-semibold text-white sm:text-base">{title}</h4>
          {runtime ? <span className="ml-auto shrink-0 text-xs text-zinc-500">{runtime} min</span> : null}
        </div>
        {overview ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">{overview}</p> : null}
      </div>
    </a>
  );
}

// Ventana flotante con la ficha de una pelicula o serie (datos del panel + TMDB). Para series incluye temporadas y
// capitulos. seed: titulo/poster de la tarjeta que se toco, para mostrar algo mientras llega la ficha.
export function MediaModal({ type, id, seed, onClose }) {
  const isSeries = type === "series";
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [season, setSeason] = useState(null);
  const [tmdbSeasons, setTmdbSeasons] = useState({});
  const [trailer, setTrailer] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setData(null);
    setSeason(null);
    setTmdbSeasons({});
    setTrailer(false);
    fetch(`/api/player/info/${type}/${id}`, { credentials: "same-origin", headers: { Accept: "application/json" }, signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((payload) => {
        setData(payload);
        setStatus("ready");
      })
      .catch((error) => error?.name !== "AbortError" && setStatus("error"));
    return () => controller.abort();
  }, [type, id]);

  const activeSeason = season ?? data?.seasons?.[0]?.number ?? null;

  // Titulo, sinopsis e imagen de cada capitulo de la temporada elegida (TMDB), solo cuando se necesitan.
  useEffect(() => {
    if (!isSeries || !data?.tmdb_id || activeSeason == null || tmdbSeasons[activeSeason]) return undefined;
    const controller = new AbortController();
    fetch(`/api/player/info/series/${id}/season/${activeSeason}?tmdb=${data.tmdb_id}`, { credentials: "same-origin", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { episodes: {} }))
      .then((payload) => setTmdbSeasons((prev) => ({ ...prev, [activeSeason]: payload.episodes || {} })))
      .catch(() => {});
    return () => controller.abort();
  }, [isSeries, id, data?.tmdb_id, activeSeason]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (trailer) setTrailer(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, trailer]);

  const title = data?.title || seed?.title || "";
  const poster = data?.poster || seed?.poster || "";
  const backdrop = data?.backdrop || seed?.backdrop || "";
  const overview = data?.overview || "";
  const year = data?.year || seed?.year;
  const rating = data?.rating || seed?.rating;
  const seasons = data?.seasons || [];
  const currentSeason = seasons.find((item) => item.number === activeSeason);
  const playUrl = data?.play_url || (isSeries ? `/play/series/${id}` : `/play/movie/${id}`);
  const loading = status === "loading";

  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/75 backdrop-blur-sm animate-[fpFade_0.2s_ease-out] sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Información"}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[94dvh] w-full max-w-4xl animate-[fpRise_0.35s_ease-out] overflow-y-auto overscroll-contain rounded-t-3xl border border-white/10 bg-[#0d0d11] shadow-[0_40px_120px_rgba(0,0,0,0.8)] outline-none sm:max-h-[90dvh] sm:rounded-2xl"
      >
        <button onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80">
          <X className="size-5" />
        </button>

        {/* Imagen superior (o el trailer) */}
        <div className="relative aspect-video w-full bg-zinc-900 sm:aspect-[21/9]">
          {trailer && data?.trailer ? (
            <iframe
              title="Tráiler"
              src={`https://www.youtube-nocookie.com/embed/${data.trailer}?autoplay=1&rel=0&modestbranding=1`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          ) : (
            <>
              {backdrop ? (
                <img src={backdrop} alt="" className="absolute inset-0 size-full object-cover animate-[fpFade_0.6s_ease-out]" />
              ) : poster ? (
                <img src={poster} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d11] via-[#0d0d11]/30 to-transparent" />
            </>
          )}
        </div>

        <div className="relative px-5 pb-8 sm:px-8">
          <div className={`flex gap-5 sm:gap-7 ${trailer ? "pt-5" : "-mt-16 sm:-mt-24"}`}>
            {poster ? (
              <img src={poster} alt={title} className="relative z-10 hidden aspect-[2/3] w-32 shrink-0 self-start rounded-xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.7)] ring-1 ring-white/15 sm:block sm:w-44" />
            ) : null}

            <div className="relative z-10 min-w-0 flex-1 space-y-4 pt-2 sm:pt-6">
              <div>
                <h2 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)] sm:text-4xl">{title}</h2>
                {data?.original_title ? <p className="mt-0.5 text-sm text-zinc-500">{data.original_title}</p> : null}
                {data?.tagline ? <p className="mt-1.5 text-sm italic text-zinc-400">{data.tagline}</p> : null}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-300">
                {rating ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                    <Star className="size-4" fill="currentColor" />
                    {Number(rating).toFixed(1)}
                  </span>
                ) : null}
                {year ? <span>{year}</span> : null}
                {data?.runtime ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5 text-zinc-500" />
                    {formatRuntime(data.runtime)}
                  </span>
                ) : null}
                {isSeries && seasons.length ? <span>{seasons.length} {seasons.length === 1 ? "temporada" : "temporadas"}</span> : null}
              </div>

              {data?.genres?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.genres.map((genre) => (
                    <Chip key={genre}>{genre}</Chip>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2.5 pt-1">
                <a href={playUrl} className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-zinc-200 md:text-base">
                  <Play className="size-5" fill="currentColor" />
                  {isSeries ? "Ver desde el inicio" : "Ver ahora"}
                </a>
                {data?.trailer ? (
                  <button onClick={() => setTrailer((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 md:text-base">
                    <Youtube className="size-5" />
                    {trailer ? "Ocultar tráiler" : "Tráiler"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Sinopsis */}
          <div className="mt-6 space-y-3">
            {loading && !overview ? (
              <div className="space-y-2">
                <div className="fp-skeleton h-3.5 w-full rounded" />
                <div className="fp-skeleton h-3.5 w-11/12 rounded" />
                <div className="fp-skeleton h-3.5 w-8/12 rounded" />
              </div>
            ) : overview ? (
              <div>
                <p className={`text-sm leading-relaxed text-zinc-300 sm:text-base ${expanded ? "" : "line-clamp-4"}`}>{overview}</p>
                {overview.length > 260 ? (
                  <button onClick={() => setExpanded((value) => !value)} className="mt-1 text-xs font-semibold text-coral transition hover:text-coral-soft">
                    {expanded ? "Ver menos" : "Ver más"}
                  </button>
                ) : null}
              </div>
            ) : status === "ready" ? (
              <p className="text-sm text-zinc-500">Este título todavía no tiene sinopsis.</p>
            ) : null}

            {status === "error" ? (
              <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">No pudimos cargar la información completa. Igual puedes verlo con el botón de arriba.</p>
            ) : null}

            {data?.directors?.length ? (
              <p className="text-sm text-zinc-400">
                <span className="text-zinc-500">{isSeries ? "Creada por" : "Dirección"}: </span>
                {data.directors.join(", ")}
              </p>
            ) : null}
          </div>

          {/* Reparto */}
          {data?.cast?.length ? (
            <section className="mt-7">
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Reparto</h3>
              <div className="fp-no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8">
                {data.cast.map((person, index) => (
                  <div key={`${person.name}-${index}`} className="w-[76px] shrink-0 text-center">
                    <div className="mx-auto grid size-[68px] place-items-center overflow-hidden rounded-full bg-white/[0.07] ring-1 ring-white/10">
                      {person.photo ? <img src={person.photo} alt="" loading="lazy" className="size-full object-cover" /> : <User className="size-6 text-zinc-600" />}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-zinc-200">{person.name}</p>
                    {person.character ? <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">{person.character}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Temporadas y capitulos */}
          {isSeries && seasons.length ? (
            <section className="mt-8">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-white">Capítulos</h3>
                {seasons.length > 1 ? (
                  seasons.length <= 6 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {seasons.map((item) => (
                        <button
                          key={item.number}
                          onClick={() => setSeason(item.number)}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${item.number === activeSeason ? "bg-white text-black" : "bg-white/[0.07] text-zinc-300 hover:bg-white/12 hover:text-white"}`}
                        >
                          {item.number === 0 ? "Especiales" : `T${item.number}`}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <select
                      value={activeSeason ?? ""}
                      onChange={(event) => setSeason(Number(event.target.value))}
                      aria-label="Temporada"
                      className="rounded-lg border border-white/15 bg-[#17171c] px-3 py-1.5 text-sm text-white outline-none focus:border-coral"
                    >
                      {seasons.map((item) => (
                        <option key={item.number} value={item.number}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  )
                ) : null}
              </div>
              <div className="-mx-2 space-y-1">
                {(currentSeason?.episodes || []).map((episode) => (
                  <EpisodeRow key={episode.id} seriesId={id} seriesTitle={title} episode={episode} meta={tmdbSeasons[activeSeason]?.[episode.number]} />
                ))}
              </div>
            </section>
          ) : null}

          {isSeries && status === "ready" && !seasons.length ? <p className="mt-8 text-sm text-zinc-500">Esta serie todavía no tiene capítulos disponibles.</p> : null}

          {data?.source === "tmdb" ? (
            <p className="mt-8 border-t border-white/[0.06] pt-4 text-[11px] leading-relaxed text-zinc-600">
              Información e imágenes de TMDB. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
