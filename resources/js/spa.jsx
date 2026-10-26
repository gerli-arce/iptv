import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Hls from "hls.js";
import "../css/app.css";
import { fetchHomeData } from "./services/homeApi";
import { getContentLabel, getSectionItemHref, getSectionItemTitle, isMovieOnlyContent, isTmdbImage, proxiedImageUrl, tmdbSize } from "./spa/helpers";
import { FeaturedChannels, LiveTv } from "./spa/LiveTv";
import { MobileNav, Navbar } from "./spa/Navbar";
import { Billboard, LandscapeCard, PosterCard, Row } from "./spa/Browse";

const csrf = document.querySelector('meta[name="csrf-token"]')?.content;

async function api(path, opts = {}) {
  const res = await fetch(`/api/player${path}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf, ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";
const SERIES_TEMP_DISABLED = false;
const SERIES_DEGRADED_MODE = false;
const HLS_CONFIG = {
  enableWorker: true,
  lowLatencyMode: false,
  liveSyncDurationCount: 2,
  liveMaxLatencyDurationCount: 5,
  initialLiveManifestSize: 1,
  startFragPrefetch: true,
  maxBufferLength: 15,
  maxMaxBufferLength: 30,
  backBufferLength: 15,
  manifestLoadingTimeOut: 15000,
  levelLoadingTimeOut: 15000,
  fragLoadingTimeOut: 30000,
  manifestLoadingMaxRetry: 3,
  levelLoadingMaxRetry: 3,
  fragLoadingMaxRetry: 5,
};

function normalizeTitle(value = "") {
  return String(value)
    .replace(/\b(HD|FHD|4K|LATINO|SUBTITULADO|ESPANOL)\b/gi, "")
    .replace(/[._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function logHls(message, payload) {
  console.debug(`[HLS] ${message}`, payload || "");
}

function hasDesktopBridge() {
  return typeof window !== "undefined" && Boolean(window.desktopBridge?.openNativeStream);
}

const DESKTOP_PLAYER_MODE_KEY = "fastnet:desktop:player-mode";

function getDesktopPlayerMode() {
  if (typeof window === "undefined" || !window.localStorage) return "internal";
  const saved = window.localStorage.getItem(DESKTOP_PLAYER_MODE_KEY);
  return saved === "vlc" ? "vlc" : "internal";
}

function setDesktopPlayerMode(mode) {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(DESKTOP_PLAYER_MODE_KEY, mode === "vlc" ? "vlc" : "internal");
}

const WEB_PAGES = new Set(["home", "live", "movies", "series", "settings"]);

const getLiveStream = (id) => api(`/live/${id}`);

function Icon({ name, className = "size-5" }) {
  const stroke = "currentColor";
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11.2 12 4l9 7.2" />
          <path d="M6.5 10.5V20h11V10.5" />
        </svg>
      );
    case "movies":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="5" width="17" height="14" rx="3" />
          <path d="M8 5v14M16 5v14" />
          <path d="M3.5 9h17M3.5 15h17" />
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </svg>
      );
    case "series":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16v12H4z" />
          <path d="M8 6 6 3M16 6l2-3" />
          <path d="M9 10l5 2-5 2z" />
        </svg>
      );
    case "bookmark":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.2L6 20V5.5a1 1 0 0 1 1-1z" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16.2 16.2 4.3 4.3" />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 1 1 12 0c0 6 2 7 2 9H4c0-2 2-3 2-9z" />
          <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
        </svg>
      );
    case "collapse":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6 9 12l6 6" />
        </svg>
      );
    case "expand":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case "play":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m8 5 11 7-11 7z" />
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "info":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 10.5v6" />
          <path d="M12 7.5h.01" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.1 4.2a1 1 0 0 1 1-.7h1.8a1 1 0 0 1 1 .7l.4 1.4a7.8 7.8 0 0 1 1.4.8l1.3-.5a1 1 0 0 1 1.1.3l1.3 1.3a1 1 0 0 1 .3 1.1l-.5 1.3c.3.4.5.9.8 1.4l1.4.4a1 1 0 0 1 .7 1v1.8a1 1 0 0 1-.7 1l-1.4.4a7.8 7.8 0 0 1-.8 1.4l.5 1.3a1 1 0 0 1-.3 1.1l-1.3 1.3a1 1 0 0 1-1.1.3l-1.3-.5a7.8 7.8 0 0 1-1.4.8l-.4 1.4a1 1 0 0 1-1 .7h-1.8a1 1 0 0 1-1-.7l-.4-1.4a7.8 7.8 0 0 1-1.4-.8l-1.3.5a1 1 0 0 1-1.1-.3L4.6 18a1 1 0 0 1-.3-1.1l.5-1.3a7.8 7.8 0 0 1-.8-1.4l-1.4-.4a1 1 0 0 1-.7-1v-1.8a1 1 0 0 1 .7-1l1.4-.4c.2-.5.5-1 .8-1.4l-.5-1.3a1 1 0 0 1 .3-1.1L5.9 6a1 1 0 0 1 1.1-.3l1.3.5c.4-.3.9-.5 1.4-.8z" />
          <circle cx="12" cy="12" r="3.1" />
        </svg>
      );
    default:
      return null;
  }
}

function Login({ onDone }) {
  const [form, setForm] = useState({ server_url: "http://iptv.fastnetperu.com.pe:80", username: "", password: "" });
  const [error, setError] = useState("");
  const salesUrl = "/";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api("/login", { method: "POST", body: JSON.stringify(form) });
      onDone();
    } catch {
      setError("Credenciales invalidas");
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink p-6 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(255,99,99,0.28),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_30%,black,transparent_75%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <a href={salesUrl} className="mx-auto mb-8 flex w-fit items-center gap-3">
          <img src="/logo-fastnet-player.png" alt="Fastnet Player" className="size-12 rounded-xl shadow-[0_0_30px_rgba(255,60,60,0.4)]" />
          <span className="text-lg font-bold tracking-tight">FastnetPlayer</span>
        </a>

        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-white/10 bg-[#0d0d11]/85 p-7 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-8">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-extrabold tracking-[-0.03em]">Iniciar sesion</h2>
            <p className="text-sm text-zinc-400">Ingresa con el usuario y la contrasena de tu servicio.</p>
          </div>

          <div className="space-y-3">
            <input className="fp-input" autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Usuario" />
            <input className="fp-input" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contrasena" />
          </div>
          {error && <p className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

          <button className="w-full rounded-lg bg-coral py-3 font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_8px_28px_rgba(255,99,99,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-coral-soft hover:shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_12px_36px_rgba(255,99,99,0.5)]">Entrar</button>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-zinc-600">
            <span className="h-px flex-1 bg-white/10" />
            <span className="font-mono">Nuevo aqui</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <p className="text-center text-sm text-zinc-400">Aun no tienes una cuenta de Fastnet Player?</p>
          <a
            href={salesUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-lg border border-white/10 bg-white/[0.06] py-3 text-center text-sm font-semibold text-zinc-100 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] transition duration-200 hover:bg-white/10"
          >
            Contrata aqui o consigue aqui una cuenta
          </a>
        </form>
      </div>
    </div>
  );
}

function SettingsPanel({ desktopMode, playerMode, setPlayerMode, hasVlc, user, onLogout }) {
  const displayName = user?.name || user?.username || "Usuario";
  const subscription = user?.status || "Activo";
  const expiry = user?.exp_date || user?.expiry || user?.exp || "Sin fecha visible";

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 text-lg font-black text-white shadow-[0_0_25px_rgba(255,99,99,0.35)]">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-white">{displayName}</p>
            <p className="text-sm text-emerald-300">Suscripcion {subscription}</p>
            <p className="text-xs text-slate-400">Expira: {expiry}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <h2 className="text-2xl font-black text-white">Preferencias de reproduccion</h2>
        <p className="mt-2 text-sm text-slate-300">
          Esta app esta enfocada en peliculas. Puedes mantener el reproductor interno o usar VLC cuando estes en escritorio.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <button
          onClick={() => setPlayerMode("internal")}
          className={`rounded-3xl border p-5 text-left transition duration-300 ${playerMode === "internal" ? "border-sky-300/50 bg-sky-400/10 shadow-fp-card" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}
        >
          <p className="text-lg font-bold text-white">Reproductor interno</p>
          <p className="mt-2 text-sm text-slate-300">
            Recomendado para celular y web. Todo se reproduce dentro de Fastnet Player.
          </p>
        </button>
        <button
          onClick={() => setPlayerMode("vlc")}
          className={`rounded-3xl border p-5 text-left transition duration-300 ${playerMode === "vlc" ? "border-emerald-300/50 bg-emerald-400/10 shadow-fp-card" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}
        >
          <p className="text-lg font-bold text-white">Abrir con VLC</p>
          <p className="mt-2 text-sm text-slate-300">
            Disponible para escritorio. Si estas en telefono, sigue usando el reproductor interno.
          </p>
          <p className={`mt-4 text-xs font-semibold ${desktopMode && hasVlc ? "text-emerald-300" : "text-amber-300"}`}>
            {desktopMode ? (hasVlc ? "VLC detectado" : "VLC no detectado") : "Modo externo solo en escritorio"}
          </p>
        </button>
      </div>

      <button
        onClick={onLogout}
        className="w-full rounded-2xl border border-rose-300/25 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-white transition duration-300 hover:border-rose-300/40 hover:bg-rose-500/15"
      >
        Cerrar sesion
      </button>
    </section>
  );
}

function ContinueWatching({ items = [] }) {
  const picks = items.slice(0, 4);
  return (
    <section>
      <h3 className="fp-section-title">Continuar viendo</h3>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {picks.map((it, idx) => {
          const progress = 18 + idx * 19;
          const remain = Math.max(8, 73 - progress);
          return (
            <div key={`${it.stream_id}-${idx}`} className="rounded-2xl border border-white/10 bg-slate-900/45 overflow-hidden hover:shadow-fp-card transition duration-300">
              <img src={it.stream_icon || ""} alt="" className="w-full h-44 object-cover" />
              <div className="p-4 space-y-2">
                <p className="text-white font-semibold line-clamp-1">{it.name}</p>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-fp-accent" style={{ width: `${progress}%` }} /></div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{remain} min restantes</span>
                  <a href={`/play/movie/${it.stream_id}`} className="text-sky-300">Continuar</a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LiveNow({ channels = [] }) {
  return (
    <section>
      <h3 className="fp-section-title">TV en vivo ahora</h3>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {channels.slice(0, 8).map((ch, i) => (
          <a key={`${ch.stream_id}-${i}`} href={`/play/channel/${ch.stream_id}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-rose-300/30 hover:shadow-fp-card transition duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white line-clamp-1">{ch.name}</p>
              <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-rose-300"><span className="size-2 rounded-full bg-rose-500 animate-pulse" />En vivo</span>
            </div>
            <img src={ch.stream_icon || ""} alt="" className="w-full h-24 object-cover rounded-lg mb-3" />
            <p className="text-xs text-slate-300">Noticias - Entretenimiento - Deportes</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function movieMeta(it = {}, extra = {}) {
  const year = String(extra.release_date || it.release_date || it.first_air_date || it.year || "").slice(0, 4);
  const rating = Number(extra.vote_average || it.rating_5based * 2 || it.rating || 0);
  return [year, rating > 0 ? `★ ${rating.toFixed(1)}` : ""].filter(Boolean).join(" · ");
}

function HoverCards({ items = [], type = "movie", limit = 10, imageOverrides = {}, metaOverrides = {} }) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 md:gap-x-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
      {items.slice(0, limit).map((it, i) => {
        const id = it.stream_id || it.series_id || it.id;
        const href = type === "series" ? `/play/series/${id}` : `/play/movie/${id}`;
        const img = imageOverrides[id] || it.stream_icon || it.cover;
        const meta = metaOverrides[id] || {};
        return (
          <PosterCard
            key={`${id}-${i}`}
            className="w-full"
            title={it.name}
            image={img}
            href={href}
            meta={movieMeta(it, meta)}
          />
        );
      })}
    </div>
  );
}

function CatalogSection({ title, items = [], categories = [], type = "movie", searchQuery = "" }) {
  const [categoryId, setCategoryId] = useState("all");
  const [imageOverrides, setImageOverrides] = useState({});
  const [metaOverrides, setMetaOverrides] = useState({});
  const q = searchQuery.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    let list = items;

    if (q) {
      list = list.filter((it) => {
        const text = [
          it.name,
          it.plot,
          it.description,
          it.genre,
          it.genre_name,
          it.year,
          it.release_date,
          it.category_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(q);
      });
    }

    if (categoryId === "all") return list;
    return list.filter((it) => String(it.category_id ?? "") === String(categoryId));
  }, [items, categoryId, q]);

  useEffect(() => {
    let cancelled = false;
    const candidates = items
      .filter((it) => !(it.stream_icon || it.cover))
      .slice(0, 40);

    if (!candidates.length) return;

    (async () => {
      const imageUpdates = {};
      const metaUpdates = {};
      await Promise.all(
        candidates.map(async (it) => {
          const id = it.stream_id || it.series_id || it.id;
          if (!id) return;
          const query = normalizeTitle(it.name || "");
          if (!query) return;
          try {
            const res = await fetch(`/api/imdb/search?q=${encodeURIComponent(query)}&language=es-MX`, { credentials: "same-origin" });
            if (!res.ok) return;
            const data = await res.json();
            const results = data?.data?.results || [];
            const desiredType = type === "series" ? "tv" : "movie";
            const first = results.find((r) => r?.media_type === desiredType && r?.poster_path) || results.find((r) => r?.poster_path);
            if (first?.poster_path) {
              imageUpdates[id] = `${TMDB_IMG_BASE}${first.poster_path}`;
            }
            metaUpdates[id] = {
              overview: first?.overview || "",
              vote_average: first?.vote_average || null,
              release_date: first?.release_date || first?.first_air_date || "",
            };
          } catch {
            // Silent fallback: keep original stream icon behavior.
          }
        }),
      );
      if (!cancelled && Object.keys(imageUpdates).length) {
        setImageOverrides((prev) => ({ ...prev, ...imageUpdates }));
      }
      if (!cancelled && Object.keys(metaUpdates).length) {
        setMetaOverrides((prev) => ({ ...prev, ...metaUpdates }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items, type]);

  useEffect(() => {
    if (categoryId === "all") return;
    const exists = categories.some((cat) => String(cat.category_id) === String(categoryId));
    if (!exists) {
      setCategoryId("all");
    }
  }, [categories, categoryId]);

  return (
    <section className="space-y-6 px-4 pb-12 pt-24 md:px-10 md:pt-28">
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">{title}</h1>
        <span className="text-sm text-zinc-500">{filteredItems.length} titulos</span>
      </div>
      <div className="flex gap-2 overflow-x-auto fp-no-scrollbar pb-1">
        <button
          onClick={() => setCategoryId("all")}
          className={`rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition duration-200 ${
            categoryId === "all" ? "border-white bg-white text-black" : "border-white/15 text-zinc-300 hover:border-white/40 hover:text-white"
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category_id}
            onClick={() => setCategoryId(cat.category_id)}
            className={`rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition duration-200 ${
              String(categoryId) === String(cat.category_id) ? "border-white bg-white text-black" : "border-white/15 text-zinc-300 hover:border-white/40 hover:text-white"
            }`}
          >
            {cat.category_name}
          </button>
        ))}
      </div>
      {!filteredItems.length ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-slate-300">
          No encontramos {type === "series" ? "series" : "peliculas"} para esta vista.
        </div>
      ) : null}
      <HoverCards
        items={filteredItems}
        type={type}
        limit={filteredItems.length || 0}
        imageOverrides={imageOverrides}
        metaOverrides={metaOverrides}
      />
    </section>
  );
}

function CategoriesHub({ items = [], categories = [], searchQuery = "" }) {
  const [categoryId, setCategoryId] = useState(() => categories[0]?.category_id || "all");
  const q = searchQuery.trim().toLowerCase();

  useEffect(() => {
    if (categoryId === "all") return;
    const exists = categories.some((cat) => String(cat.category_id) === String(categoryId));
    if (!exists) {
      setCategoryId(categories[0]?.category_id || "all");
    }
  }, [categories, categoryId]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (categoryId !== "all") {
      list = list.filter((it) => String(it.category_id ?? "") === String(categoryId));
    }
    if (!q) return list;
    return list.filter((it) =>
      [it.name, it.plot, it.description, it.genre, it.category_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, categoryId, q]);

  const selectedCategory = categories.find((cat) => String(cat.category_id) === String(categoryId));

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-sky-500/12 via-white/[0.04] to-transparent p-5 md:p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-sky-200/80">Explorar por genero</p>
        <h2 className="mt-2 text-2xl font-black text-white">
          {selectedCategory?.category_name || "Todas las categorias"}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          {filteredItems.length} peliculas listas para reproducir en esta seccion.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 fp-no-scrollbar">
        <button
          onClick={() => setCategoryId("all")}
          className={`rounded-xl border px-4 py-2 text-sm whitespace-nowrap transition duration-300 ${
            categoryId === "all" ? "border-sky-300/40 bg-sky-500/25 text-white" : "border-white/10 text-slate-300 hover:bg-white/10"
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category_id}
            onClick={() => setCategoryId(cat.category_id)}
            className={`rounded-xl border px-4 py-2 text-sm whitespace-nowrap transition duration-300 ${
              String(categoryId) === String(cat.category_id) ? "border-sky-300/40 bg-sky-500/25 text-white" : "border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {cat.category_name}
          </button>
        ))}
      </div>

      <HoverCards
        title="Categorias"
        items={filteredItems}
        type="movie"
        limit={Math.min(filteredItems.length, 18)}
        hideTitle
      />
    </section>
  );
}

function TopTen({ items = [] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="fp-section-title mt-0">Top 10 Fastnet</h3>
      <div className="space-y-2">
        {items.slice(0, 10).map((it, idx) => (
          <a key={`${it.stream_id}-${idx}`} href={`/play/movie/${it.stream_id}`} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2 hover:bg-white/10 transition duration-300">
            <span className="text-sky-300 text-xl font-black w-8">{idx + 1}</span>
            <span className="text-white line-clamp-1">{it.name}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function StatsPanel({ home }) {
  const stats = useMemo(() => ([
    ["Canales", home?.channels?.length || 0],
    ["Peliculas", home?.movies?.length || 0],
    ["Series", home?.series?.length || 0],
    ["Agregado reciente", Math.min((home?.movies?.length || 0) + (home?.series?.length || 0), 187)],
  ]), [home]);

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(([label, val]) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
          <p className="text-3xl font-black text-white">{val}</p>
          <p className="text-sm text-slate-300">{label}</p>
        </div>
      ))}
    </section>
  );
}

function movieHref(movie) {
  return `/play/movie/${movie.stream_id || movie.id}`;
}

function bannerHref(banner) {
  if (banner.content_type === "url") return banner.action_url;
  if (banner.external_id) return `/play/${banner.content_type}/${banner.external_id}`;
  return banner.action_url;
}

function HomeSkeleton() {
  return (
    <div>
      <div className="fp-skeleton h-[420px] w-full md:h-[560px]" />
      <div className="space-y-8 px-4 pt-8 md:px-10">
        {[0, 1].map((n) => (
          <div key={n} className="space-y-3">
            <div className="fp-skeleton h-6 w-48 rounded-md" />
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2, 3, 4, 5].map((c) => (
                <div key={c} className="fp-skeleton aspect-video w-[250px] shrink-0 rounded-lg md:w-[320px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeLike({ home, isLoading, error, onRetry, searchQuery = "", movies = [], movieCategories = [], blockedIds = new Set(), liveChannels = [], liveCategories = [] }) {
  const q = searchQuery.trim().toLowerCase();

  // Solo las peliculas se bloquean: los ids de series/canales son otra numeracion.
  const isBlockedItem = (item) => /^(movie|movies|vod)$/i.test(String(item?.content_type || "")) && blockedIds.has(String(item?.external_id));

  const banners = (home?.banners || []).filter((banner) => isMovieOnlyContent(banner.content_type) && !isBlockedItem(banner));
  const sections = (home?.sections || [])
    .filter((section) => isMovieOnlyContent(section?.content_type))
    .map((section) => ({
      ...section,
      items: Array.isArray(section.items) ? section.items.filter((item) => item && isMovieOnlyContent(item.content_type) && !isBlockedItem(item)) : [],
    }))
    .filter((section) => section.items.length > 0);
  const featuredMovies = (home?.movies || []).filter((movie) => movie && !blockedIds.has(String(movie.stream_id ?? movie.id)));

  const slides = useMemo(() => {
    if (banners.length) {
      return banners.slice(0, 5).map((banner, i) => ({
        id: banner.id || `${banner.title}-${i}`,
        title: banner.title || "Destacado",
        subtitle: banner.subtitle,
        image: proxiedImageUrl(banner.image_url || banner.mobile_image_url),
        href: bannerHref(banner),
        badge: getContentLabel(banner.content_type),
      }));
    }
    const sectionItems = sections.flatMap((section) => section.items).filter((item) => item.custom_image).slice(0, 5);
    if (sectionItems.length) {
      return sectionItems.map((item, i) => {
        const poster = isTmdbImage(item.custom_image);
        return {
          id: item.id || `${item.external_id}-${i}`,
          title: getSectionItemTitle(item),
          subtitle: item.overview || item.description || item.plot || "",
          image: poster ? "" : proxiedImageUrl(item.custom_image),
          poster: poster ? proxiedImageUrl(tmdbSize(item.custom_image, "w780")) : "",
          query: poster ? getSectionItemTitle(item) : "",
          kind: String(item.content_type).toLowerCase() === "series" ? "tv" : "movie",
          href: getSectionItemHref(item),
          badge: item.badge || getContentLabel(item.content_type),
        };
      });
    }
    const pool = featuredMovies.length ? featuredMovies : movies;
    return [...pool]
      .filter((movie) => movie.stream_icon || movie.cover)
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 5)
      .map((movie) => ({
        id: movie.stream_id || movie.id,
        title: movie.name,
        subtitle: movie.plot || movie.description || "",
        poster: proxiedImageUrl(movie.stream_icon || movie.cover),
        query: movie.name,
        kind: "movie",
        href: movieHref(movie),
        badge: "Pelicula",
      }));
  }, [home, movies]);

  // Fondo horizontal en HD desde TMDB; mientras llega (o si falla) se ve el poster con desenfoque.
  const [backdrops, setBackdrops] = useState({});
  useEffect(() => {
    let cancelled = false;
    slides
      .filter((slide) => slide.query && !backdrops[slide.id])
      .forEach(async (slide) => {
        try {
          const res = await fetch(`/api/imdb/search?q=${encodeURIComponent(normalizeTitle(slide.query))}&language=es-MX`, { credentials: "same-origin" });
          if (!res.ok) return;
          const data = await res.json();
          const results = data?.data?.results || [];
          const hit = results.find((r) => r?.media_type === slide.kind && r?.backdrop_path) || results.find((r) => r?.backdrop_path);
          if (hit && !cancelled) {
            setBackdrops((prev) => ({ ...prev, [slide.id]: proxiedImageUrl(`https://image.tmdb.org/t/p/original${hit.backdrop_path}`) }));
          }
        } catch {
          // Sin TMDB se mantiene el poster.
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slides]);
  const heroSlides = useMemo(() => slides.map((slide) => (backdrops[slide.id] ? { ...slide, image: backdrops[slide.id] } : slide)), [slides, backdrops]);

  const catalogRows = useMemo(() => {
    if (!movies.length) return [];
    const withAdded = movies.some((movie) => Number(movie.added));
    const recent = withAdded ? [...movies].sort((a, b) => Number(b.added || 0) - Number(a.added || 0)) : movies;
    const rows = [{ key: "recent", title: "Agregadas recientemente", items: recent.slice(0, 24) }];

    const counts = new Map();
    movies.forEach((movie) => counts.set(String(movie.category_id), (counts.get(String(movie.category_id)) || 0) + 1));
    movieCategories
      .map((category) => ({ category, count: counts.get(String(category.category_id)) || 0 }))
      .filter((entry) => entry.count >= 3)
      .sort((a, b) => b.count - a.count)
      .forEach(({ category }) => {
        rows.push({
          key: `cat-${category.category_id}`,
          title: category.category_name,
          items: movies.filter((movie) => String(movie.category_id) === String(category.category_id)).slice(0, 24),
        });
      });
    return rows;
  }, [movies, movieCategories]);

  const searchResults = useMemo(() => {
    if (!q) return [];
    const matches = (text) => String(text || "").toLowerCase().includes(q);
    const seen = new Set();
    return [...featuredMovies, ...movies]
      .filter((movie) => [movie.name, movie.plot, movie.genre, movie.category_name, movie.year].some(matches))
      .filter((movie) => {
        const id = movie.stream_id || movie.id;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }, [q, home, movies]);

  if (error && !home && !movies.length) {
    return (
      <section className="mx-4 mt-28 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-8 text-white md:mx-10">
        <p className="text-xl font-bold">No se pudo cargar el inicio</p>
        <p className="mt-2 text-sm text-rose-100/90">{error}</p>
        <button onClick={onRetry} className="mt-5 rounded-lg bg-coral px-5 py-3 font-semibold text-white transition hover:bg-coral-soft">
          Reintentar
        </button>
      </section>
    );
  }

  if (isLoading && !home && !movies.length) return <HomeSkeleton />;

  if (q) {
    return (
      <section className="space-y-6 px-4 pb-12 pt-24 md:px-10 md:pt-28">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-white md:text-3xl">
          Resultados para <span className="text-coral">"{searchQuery.trim()}"</span>
        </h1>
        {searchResults.length ? (
          <HoverCards items={searchResults} type="movie" limit={120} />
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-zinc-400">
            No encontramos peliculas con ese nombre.
          </p>
        )}
      </section>
    );
  }

  const hasContent = slides.length || sections.length || featuredMovies.length || catalogRows.length;

  return (
    <div className="pb-12">
      <Billboard slides={heroSlides} />

      <div className={`relative z-10 space-y-8 md:space-y-10 ${slides.length ? "-mt-8 md:-mt-14" : "pt-24 md:pt-28"}`}>
        <div className="pt-5 md:pt-2">
          <FeaturedChannels channels={liveChannels} categories={liveCategories} getStream={getLiveStream} />
        </div>

        {sections.map((section) => (
          <Row key={section.id || section.slug || section.title} title={section.title}>
            {section.items.map((item, i) =>
              isTmdbImage(item.custom_image) ? (
                <PosterCard
                  key={item.id || `${item.external_id}-${i}`}
                  title={getSectionItemTitle(item)}
                  image={proxiedImageUrl(tmdbSize(item.custom_image, "w500"))}
                  href={getSectionItemHref(item)}
                  meta={getContentLabel(item.content_type)}
                />
              ) : (
                <LandscapeCard
                  key={item.id || `${item.external_id}-${i}`}
                  title={getSectionItemTitle(item)}
                  image={proxiedImageUrl(item.custom_image)}
                  href={getSectionItemHref(item)}
                  badge={item.badge}
                  label={getContentLabel(item.content_type)}
                />
              ),
            )}
          </Row>
        ))}

        {featuredMovies.length ? (
          <Row title="Recomendadas para ti">
            {featuredMovies.slice(0, 24).map((movie) => (
              <PosterCard key={movie.stream_id || movie.id} title={movie.name} image={movie.stream_icon || movie.cover} href={movieHref(movie)} meta={movieMeta(movie)} />
            ))}
          </Row>
        ) : null}

        {catalogRows.map((row) => (
          <Row key={row.key} title={row.title}>
            {row.items.map((movie) => (
              <PosterCard key={movie.stream_id || movie.id} title={movie.name} image={movie.stream_icon || movie.cover} href={movieHref(movie)} meta={movieMeta(movie)} />
            ))}
          </Row>
        ))}

        {!hasContent ? (
          <p className="mx-4 rounded-xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-zinc-400 md:mx-10">
            No hay peliculas disponibles por ahora.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function extractFallbackCatalogItems(home, desiredType) {
  const normalizedType = desiredType === "series" ? "series" : "movie";
  const directItems = normalizedType === "series" ? home?.series : home?.movies;
  const safeDirectItems = Array.isArray(directItems) ? directItems.filter(Boolean) : [];

  if (safeDirectItems.length) {
    return safeDirectItems;
  }

  const sectionItems = Array.isArray(home?.sections)
    ? home.sections.flatMap((section) => (Array.isArray(section?.items) ? section.items : []))
    : [];

  return sectionItems.filter((item) => {
    if (!item) return false;
    const type = String(item.content_type || "").toLowerCase();
    if (normalizedType === "series") {
      return type === "series";
    }
    return type === "movie" || type === "movies" || type === "vod";
  });
}

function LiveLayout({ data, query, setQuery, playerMode }) {
  const channels = data?.channels || [];
  const categories = data?.categories || [];
  const desktopMode = hasDesktopBridge();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const volumeRef = useRef(0.85);
  const retryRef = useRef(0);
  const selectionStartRef = useRef(0);
  const launchedDesktopStreamRef = useRef("");
  const [volume, setVolume] = useState(0.85);
  const [playError, setPlayError] = useState("");
  const [candidateIndex, setCandidateIndex] = useState(0);
  const candidateSources = useMemo(() => {
    const list = data?.streamCandidates?.length ? data.streamCandidates : [data?.streamUrl];
    return list.filter(Boolean);
  }, [data?.streamCandidates, data?.streamUrl]);
  const candidateKey = useMemo(() => candidateSources.join("|"), [candidateSources]);

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    video.requestFullscreen?.();
  };

  const stopCurrentStream = (video) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!video) return;

    video.pause();
    video.removeAttribute("src");
    video.load();
  };

  const startPlayback = async (video, src, mode) => {
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    try {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === "function") {
        await playPromise;
      }
      const elapsedMs = selectionStartRef.current ? Math.round(performance.now() - selectionStartRef.current) : null;
      logHls(`playback started (${mode})`, { src, elapsedMs });
      video.muted = false;
      video.volume = volumeRef.current;
    } catch (error) {
      if (error?.name === "NotAllowedError") {
        logHls("autoplay blocked", { mode, src, error: error?.message || String(error) });
      } else {
        logHls("playback error", { mode, src, error: error?.message || String(error) });
      }
    }
  };

  useEffect(() => {
    if (desktopMode && playerMode === "vlc") {
      const desktopStream = candidateSources[0] || data?.streamUrl;
      if (!desktopStream) return;
      if (launchedDesktopStreamRef.current === desktopStream) return;

      launchedDesktopStreamRef.current = desktopStream;
      window.desktopBridge.openVlcStream?.(desktopStream);
      return;
    }

    const video = videoRef.current;
    const src = candidateSources[candidateIndex] || candidateSources[0];
    if (!video) return;

    stopCurrentStream(video);
    setPlayError("");
    retryRef.current = 0;

    if (!src) return;

    const canPlayNativeHls = video.canPlayType("application/vnd.apple.mpegurl");
    const shouldUseHlsJs = src.includes(".m3u8") && Hls.isSupported();
    const tryNextCandidate = () => {
      if (candidateIndex + 1 < candidateSources.length) {
        setCandidateIndex((n) => n + 1);
      } else {
        setPlayError("Este canal no pudo reproducirse en el navegador. Prueba otro canal o vuelve a intentar.");
      }
    };

    if (shouldUseHlsJs) {
      const hls = new Hls(HLS_CONFIG);
      hlsRef.current = hls;
      logHls("loading manifest", {
        src,
        candidateIndex,
        elapsedMs: selectionStartRef.current ? Math.round(performance.now() - selectionStartRef.current) : null,
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        logHls("manifest loaded", {
          src,
          elapsedMs: selectionStartRef.current ? Math.round(performance.now() - selectionStartRef.current) : null,
        });
        startPlayback(video, src, "hls.js");
      });

      hls.on(Hls.Events.ERROR, (_, event) => {
        logHls("error", {
          src,
          fatal: Boolean(event?.fatal),
          type: event?.type,
          details: event?.details,
          response: event?.response?.code,
        });
        if (!event?.fatal) return;
        if (retryRef.current < 2) {
          retryRef.current += 1;
          if (event.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
            return;
          }
          if (event.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
            return;
          }
        }
        if (event.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
          tryNextCandidate();
          return;
        }
        if (event.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          tryNextCandidate();
          return;
        }
        tryNextCandidate();
      });

      hls.attachMedia(video);
      hls.loadSource(src);
      return () => {
        if (hlsRef.current === hls) {
          hls.destroy();
          hlsRef.current = null;
        }
      };
    }

    if (src.includes(".m3u8") && canPlayNativeHls) {
      logHls("using native HLS fallback", {
        src,
        elapsedMs: selectionStartRef.current ? Math.round(performance.now() - selectionStartRef.current) : null,
      });
      video.preload = "auto";
      video.muted = true;
      video.src = src;
      video.load();
      startPlayback(video, src, "native-hls");
      return () => {
        stopCurrentStream(video);
      };
    }

    logHls("using direct stream fallback", {
      src,
      elapsedMs: selectionStartRef.current ? Math.round(performance.now() - selectionStartRef.current) : null,
    });
    video.src = src;
    video.preload = "auto";
    video.muted = true;
    video.load();
    startPlayback(video, src, "direct");
    const onVideoError = () => tryNextCandidate();
    video.addEventListener("error", onVideoError);
    return () => {
      video.removeEventListener("error", onVideoError);
      stopCurrentStream(video);
    };
  }, [candidateIndex, candidateKey, data?.streamUrl, desktopMode, playerMode]);

  useEffect(() => {
    setCandidateIndex(0);
    setPlayError("");
  }, [data?.currentChannel?.stream_id]);

  useEffect(() => {
    if (data?.currentChannel?.stream_id) {
      logHls("channel selected", {
        streamId: data.currentChannel.stream_id,
        name: data.currentChannel.name,
        elapsedMs: selectionStartRef.current ? Math.round(performance.now() - selectionStartRef.current) : null,
      });
    }
  }, [data?.currentChannel?.stream_id]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = volume;
    volumeRef.current = volume;
    if (volume > 0 && videoRef.current.muted) {
      videoRef.current.muted = false;
    }
  }, [volume]);

  return (
    <div className="grid lg:grid-cols-[430px_1fr] gap-6 h-[calc(100vh-8rem)] min-h-[620px] items-start">
      <div className="grid md:grid-cols-[170px_1fr] lg:grid-cols-[180px_1fr] gap-4 h-full min-h-0">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-y-auto h-full min-h-0 fp-no-scrollbar">
          <button onClick={() => setQuery({ ...query, category_id: "all" })} className={`w-full text-left px-4 py-3 ${query.category_id === "all" ? "bg-sky-500/25 text-white" : "text-slate-300"}`}>Todo</button>
          {categories.map((c) => <button key={c.category_id} onClick={() => setQuery({ ...query, category_id: c.category_id })} className={`w-full text-left px-4 py-3 ${String(query.category_id) === String(c.category_id) ? "bg-sky-500/25 text-white" : "text-slate-300"}`}>{c.category_name}</button>)}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-y-auto h-full min-h-0 fp-no-scrollbar">
          {channels.map((ch, i) => (
            <button
              key={`${ch.stream_id}-${i}`}
              onClick={() => {
                selectionStartRef.current = performance.now();
                logHls("channel clicked", { streamId: ch.stream_id, name: ch.name });
                setQuery({ ...query, ch: ch.stream_id });
              }}
              className={`w-full text-left px-3 py-3 border-b border-white/5 ${Number(query.ch) === Number(ch.stream_id) ? "bg-sky-500/25 text-white" : "text-slate-300"}`}
            >
              <span className="flex items-center gap-3">
                {ch.stream_icon ? (
                  <span className="size-8 rounded-md border border-white/10 shrink-0 bg-slate-900/70 p-0.5 flex items-center justify-center">
                    <img src={ch.stream_icon} alt="" className="h-full w-full object-contain" />
                  </span>
                ) : (
                  <span className="size-8 rounded-md bg-slate-700/80 border border-white/10 shrink-0 flex items-center justify-center text-[10px] font-bold text-sky-200">
                    TV
                  </span>
                )}
                <span className="line-clamp-1">{ch.name}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative rounded-3xl border border-white/10 bg-black overflow-hidden h-full min-h-0">
        {desktopMode && playerMode === "vlc" ? (
          <div className="h-[calc(100%-56px)] grid place-items-center p-6 text-center">
            <div className="max-w-md space-y-3">
              <p className="text-2xl font-black text-white">Modo VLC activado</p>
              <p className="text-sm text-slate-300">
                El canal se abrira en la aplicacion VLC instalada en tu PC. Si prefieres reproducir dentro de Fastnet Player, cambia el modo en Ajustes.
              </p>
              <button
                onClick={() => {
                  const desktopStream = candidateSources[0] || data?.streamUrl;
                  if (!desktopStream) return;
                  launchedDesktopStreamRef.current = desktopStream;
                  window.desktopBridge.openVlcStream?.(desktopStream);
                }}
                className="rounded-xl bg-fp-accent px-5 py-3 font-semibold text-white transition hover:shadow-fp-button"
              >
                Abrir en VLC
              </button>
              <p className="text-xs text-slate-400">
                Si no se abre nada, instala VLC y vuelve a intentar.
              </p>
            </div>
          </div>
        ) : data?.streamUrl ? (
          <video ref={videoRef} autoPlay muted preload="auto" playsInline onDoubleClick={toggleFullscreen} className="w-full h-[calc(100%-56px)] object-contain" />
        ) : (
          <div className="h-full grid place-items-center text-slate-300">Selecciona un canal</div>
        )}
        {playError ? (
          <div className="absolute inset-x-0 top-4 mx-auto w-[92%] max-w-2xl rounded-xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <span>{playError}</span>
              <button onClick={() => setCandidateIndex(0)} className="rounded-lg border border-white/20 px-3 py-1 text-xs hover:bg-white/10">Reintentar</button>
            </div>
          </div>
        ) : null}
        <div className="px-5 py-4 border-t border-white/10 text-white flex items-center gap-3">
          {data?.currentChannel?.stream_icon ? (
            <span className="size-9 rounded-md border border-white/10 shrink-0 bg-slate-900/70 p-0.5 flex items-center justify-center">
              <img src={data.currentChannel.stream_icon} alt="" className="h-full w-full object-contain" />
            </span>
          ) : (
            <span className="size-9 rounded-md bg-slate-700/80 border border-white/10 shrink-0 flex items-center justify-center text-[10px] font-bold text-sky-200">
              TV
            </span>
          )}
          <span className="line-clamp-1 flex-1">{data?.currentChannel?.name || "TV en vivo"}</span>
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-rose-300">
            <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
            En vivo
          </span>
          <div className="flex items-center gap-2 min-w-[150px]">
            <span className="text-xs text-slate-300">Vol</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-sky-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const desktopMode = hasDesktopBridge();
  const [auth, setAuth] = useState({ ready: false, ok: false, user: null });
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem("fastnet:lastPage");
    return WEB_PAGES.has(saved) ? saved : "home";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState({
    home: null,
    homeLoading: false,
    homeError: null,
    movies: null,
    movieCategories: [],
    unplayableIds: [],
    series: null,
    seriesCategories: [],
    unplayableSeriesIds: [],
    live: null,
    liveError: false,
  });
  const [playerMode, setPlayerModeState] = useState(() => (desktopMode ? getDesktopPlayerMode() : "internal"));
  const [hasVlc, setHasVlc] = useState(false);

  useEffect(() => {
    api("/me").then((m) => setAuth({ ready: true, ok: true, user: m.user })).catch(() => setAuth({ ready: true, ok: false, user: null }));
  }, []);

  useEffect(() => {
    localStorage.setItem("fastnet:lastPage", page);
  }, [page]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    if (WEB_PAGES.has(page)) return;
    setPage("home");
  }, [page]);

  useEffect(() => {
    if (!desktopMode) return;
    window.desktopBridge.hasVlc?.().then((value) => setHasVlc(Boolean(value))).catch(() => setHasVlc(false));
  }, [desktopMode]);

  useEffect(() => {
    if (!auth.ok || page !== "home" || data.home || data.homeLoading) return;

    let cancelled = false;

    setData((state) => ({
      ...state,
      homeLoading: true,
      homeError: null,
    }));

    fetchHomeData()
      .then((result) => {
        if (cancelled) return;
        setData((state) => ({
          ...state,
          home: result,
          homeLoading: false,
          homeError: null,
        }));
      })
      .catch((error) => {
        if (cancelled) return;
        setData((state) => ({
          ...state,
          homeLoading: false,
          homeError: error?.message || "No se pudo cargar el home",
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [auth.ok, page, data.home]);

  useEffect(() => {
    if (!auth.ok || (page !== "live" && page !== "home") || data.live || data.liveError) return;
    api("/live")
      .then((d) => setData((state) => ({ ...state, live: { channels: d.channels || [], categories: d.categories || [] } })))
      .catch(() => setData((state) => ({ ...state, liveError: true })));
  }, [auth.ok, page, data.live, data.liveError]);

  const setPlayerMode = (mode) => {
    const nextMode = mode === "vlc" ? "vlc" : "internal";
    setPlayerModeState(nextMode);
    setDesktopPlayerMode(nextMode);
  };

  useEffect(() => {
    if (!auth.ok) return;
    if ((page === "movies" || page === "home") && !data.movies) {
      api("/movies")
        .then((d) => setData((s) => ({ ...s, movies: d.items || [], movieCategories: d.categories || [], unplayableIds: d.unplayable_ids || [] })))
        .catch(() => setData((s) => ({ ...s, movies: s.movies || [] })));
    }
    if (page === "series" && !data.series) api("/series").then((d) => setData((s) => ({ ...s, series: d.items || [], seriesCategories: d.categories || [], unplayableSeriesIds: d.unplayable_ids || [] })));
  }, [auth.ok, page, data.movies, data.series]);

  // Peliculas que el navegador no reproduce bien (audio AC3/DTS...) se ocultan; con VLC externo se muestran todas.
  const hideUnplayable = !(desktopMode && playerMode === "vlc");
  const blockedIds = useMemo(
    () => (hideUnplayable ? new Set((data.unplayableIds || []).map(String)) : new Set()),
    [hideUnplayable, data.unplayableIds],
  );

  const blockedSeriesIds = useMemo(
    () => (hideUnplayable ? new Set((data.unplayableSeriesIds || []).map(String)) : new Set()),
    [hideUnplayable, data.unplayableSeriesIds],
  );

  const onLogout = async () => {
    await api("/logout", { method: "POST" });
    setAuth({ ready: true, ok: false, user: null });
  };

  if (!auth.ready) return <div className="min-h-screen grid place-items-center text-white bg-fp-night">Cargando...</div>;
  if (!auth.ok) return <Login onDone={() => { window.location.href = "/app"; }} />;

  const isVisibleMovie = (movie) => !blockedIds.has(String(movie?.stream_id ?? movie?.external_id ?? ""));
  const visibleMovies = (data.movies || []).filter(isVisibleMovie);
  const visibleCategoryIds = new Set(visibleMovies.map((movie) => String(movie.category_id)));
  const movieCategories = (data.movieCategories || []).filter((category) => !data.movies?.length || visibleCategoryIds.has(String(category.category_id)));
  const movieCatalogItems = (data.movies && data.movies.length)
    ? visibleMovies
    : extractFallbackCatalogItems(data.home, "movie").filter(isVisibleMovie);
  const isVisibleSeries = (item) => !blockedSeriesIds.has(String(item?.series_id ?? item?.external_id ?? ""));
  const visibleSeries = (data.series || []).filter(isVisibleSeries);
  const visibleSeriesCategoryIds = new Set(visibleSeries.map((item) => String(item.category_id)));
  const seriesCategories = (data.seriesCategories || []).filter((category) => !data.series?.length || visibleSeriesCategoryIds.has(String(category.category_id)));
  const seriesCatalogItems = (data.series && data.series.length)
    ? visibleSeries
    : extractFallbackCatalogItems(data.home, "series").filter(isVisibleSeries);

  return (
    <div className="min-h-screen bg-ink text-white">
      <Navbar
        page={page}
        setPage={setPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={auth.user}
        onLogout={onLogout}
      />

      <main className="pb-20 md:pb-0">
        {page === "home" && (
          <HomeLike
            home={data.home}
            isLoading={data.homeLoading}
            error={data.homeError}
            searchQuery={searchQuery}
            movies={visibleMovies}
            blockedIds={blockedIds}
            movieCategories={movieCategories}
            liveChannels={(data.live?.channels || []).filter((c) => !(hideUnplayable && c.web_playable === false))}
            liveCategories={data.live?.categories || []}
            onRetry={() => {
              setData((state) => ({
                ...state,
                home: null,
                homeLoading: false,
                homeError: null,
              }));
            }}
          />
        )}
        {page === "live" && (
          <LiveTv
            channels={data.live?.channels || []}
            categories={data.live?.categories || []}
            loading={!data.live && !data.liveError}
            error={data.liveError}
            searchQuery={searchQuery}
            hideUnplayable={hideUnplayable}
            getStream={getLiveStream}
            onRetry={() => setData((state) => ({ ...state, live: null, liveError: false }))}
          />
        )}
        {page === "movies" && (
          <CatalogSection
            title="Peliculas"
            items={movieCatalogItems}
            categories={movieCategories}
            type="movie"
            searchQuery={searchQuery}
          />
        )}
        {page === "series" && (
          <CatalogSection
            title="Series"
            items={seriesCatalogItems}
            categories={seriesCategories}
            type="series"
            searchQuery={searchQuery}
          />
        )}
        {page === "settings" && (
          <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-24 md:px-10 md:pt-28">
            <SettingsPanel
              desktopMode={desktopMode}
              playerMode={playerMode}
              setPlayerMode={setPlayerMode}
              hasVlc={hasVlc}
              user={auth.user}
              onLogout={onLogout}
            />
          </div>
        )}
      </main>

      <MobileNav page={page} setPage={setPage} />
    </div>
  );
}

createRoot(document.getElementById("app")).render(<App />);
