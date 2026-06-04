import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Hls from "hls.js";
import "../css/app.css";
import { fetchHomeData } from "./services/homeApi";

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

function proxiedImageUrl(url) {
  if (!url) return "";
  if (/^\/|^data:|^blob:/i.test(String(url))) return url;
  return `/image-proxy?url=${encodeURIComponent(url)}`;
}

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

function getSectionItemHref(item = {}) {
  const contentType = item.content_type;
  const externalId = item.external_id;
  const actionUrl = item.action_url;

  if (contentType === "url") {
    return actionUrl || "#";
  }

  if (!contentType || !externalId) {
    return "#";
  }

  return `/play/${contentType}/${externalId}`;
}

function getSectionItemTitle(item = {}) {
  return item.custom_title || item.title || item.name || item.external_id || "Contenido";
}

const quickAccess = [
  { key: "movies", label: "Peliculas", icon: "🎬", detail: "Catalogo premium", metric: "8.4K" },
  { key: "series", label: "Series", icon: "📚", detail: "Temporadas", metric: "3.1K" },
  { key: "continue", label: "Continuar viendo", icon: "🕒", detail: "En progreso", metric: "17" },
];

const WEB_PAGES = new Set(["home", "movies", "series"]);

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
    <div
      className="min-h-screen grid place-items-center p-6 text-white bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/bg-iptv-futuristic.png')" }}
    >
      <div className="absolute inset-0 bg-[#020617]/70" />
      <form onSubmit={submit} className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl p-8 space-y-4 shadow-fp-glow">
        <h2 className="text-4xl font-black tracking-tight">FastnetPlayer</h2>
        <input className="fp-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Usuario" />
        <input className="fp-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contrasena" />
        {error && <p className="text-rose-300 text-sm">{error}</p>}
        <button className="w-full rounded-xl bg-fp-accent py-3 font-bold transition duration-300 hover:scale-[1.01] hover:shadow-fp-button">Entrar</button>
        <a
          href={salesUrl}
          target="_blank"
          rel="noreferrer"
          className="block w-full text-center text-sm text-cyan-200/90 hover:text-cyan-100 transition duration-300"
        >
          Aun no tienes una cuenta de la mejor senal IPTV?
        </a>
        <a
          href={salesUrl}
          target="_blank"
          rel="noreferrer"
          className="block w-full text-center rounded-xl border border-white/20 bg-white/5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/10"
        >
          Contrata aqui o consigue aqui una cuenta
        </a>
      </form>
    </div>
  );
}

function Side({ page, setPage, onLogout, user, desktopMode, playerMode }) {
  const links = [
    ["home", "Inicio"],
    ["movies", "Peliculas"],
    ["series", "Series"],
    ["list", "Mi lista"],
    ...(desktopMode ? [["settings", "Ajustes"]] : []),
  ];

  return (
    <aside className="hidden xl:flex w-72 shrink-0 flex-col rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-5 shadow-fp-soft h-[calc(100vh-2rem)] sticky top-4 overflow-y-auto fp-no-scrollbar">
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <img
          src="/logo fast_tv.png"
          alt="Fastnet Player"
          className="w-full h-auto rounded-xl object-cover"
        />
      </div>
      <nav className="space-y-2">
        {links.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPage(key)}
            className={`w-full text-left px-4 py-3 rounded-xl transition duration-300 ${page === key ? "bg-fp-accent text-white shadow-fp-button" : "text-slate-200 hover:bg-white/10"}`}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-white font-semibold">{user?.username || "Usuario"}</p>
        <p className="text-emerald-300 text-sm">Activo</p>
        {desktopMode ? (
          <p className="mt-2 text-xs text-slate-300">
            Reproductor: {playerMode === "vlc" ? "VLC externo" : "Interno"}
          </p>
        ) : null}
      </div>
      <button className="mt-3 mb-1 rounded-xl border border-white/15 py-3 text-white hover:bg-white/10 transition duration-300" onClick={onLogout}>Cerrar sesion</button>
    </aside>
  );
}

function SettingsPanel({ desktopMode, playerMode, setPlayerMode, hasVlc }) {
  if (!desktopMode) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-slate-200">
        Los ajustes de reproductor externo solo estan disponibles en la app de escritorio.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-3xl font-black text-white">Ajustes del reproductor</h2>
        <p className="mt-2 text-sm text-slate-300">
          Por defecto la app usa el reproductor interno, igual que la web o la APK. Si prefieres VLC, puedes activarlo aqui.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <button
          onClick={() => setPlayerMode("internal")}
          className={`rounded-3xl border p-6 text-left transition duration-300 ${playerMode === "internal" ? "border-sky-300/50 bg-sky-400/10 shadow-fp-card" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}
        >
          <p className="text-xl font-bold text-white">Reproductor interno</p>
          <p className="mt-2 text-sm text-slate-300">
            Recomendado. Usa el video embebido dentro de la app y no requiere instalar nada extra.
          </p>
        </button>
        <button
          onClick={() => setPlayerMode("vlc")}
          className={`rounded-3xl border p-6 text-left transition duration-300 ${playerMode === "vlc" ? "border-emerald-300/50 bg-emerald-400/10 shadow-fp-card" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}
        >
          <p className="text-xl font-bold text-white">Abrir con VLC</p>
          <p className="mt-2 text-sm text-slate-300">
            Usa la app de VLC instalada en la PC para abrir el canal fuera de Fastnet Player.
          </p>
          <p className={`mt-4 text-xs font-semibold ${hasVlc ? "text-emerald-300" : "text-amber-300"}`}>
            {hasVlc ? "VLC detectado" : "VLC no detectado. Instalalo para usar este modo."}
          </p>
        </button>
      </div>
    </section>
  );
}

function HeroSection({ hero, tmdbHero }) {
  const bg = tmdbHero?.backdrop_path ? `${TMDB_IMG_BASE}${tmdbHero.backdrop_path}` : (hero?.stream_icon || hero?.cover);
  const title = tmdbHero?.title || tmdbHero?.name || hero?.name || "FASTNET ORIGINAL";
  const year = (tmdbHero?.release_date || tmdbHero?.first_air_date || "").slice(0, 4);
  const runtime = tmdbHero?.runtime ? `${tmdbHero.runtime} min` : "";
  const rating = tmdbHero?.vote_average ? `${Number(tmdbHero.vote_average).toFixed(1)} TMDB` : "";
  const genres = (tmdbHero?.genres || []).slice(0, 3).map((g) => g.name);
  const overview = tmdbHero?.overview || hero?.plot || hero?.description || "";
  const cast = (tmdbHero?.credits?.cast || []).slice(0, 4).map((p) => p.name).filter(Boolean);
  const tags = [...genres, year, runtime, rating].filter(Boolean);
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-sky-300/20 bg-slate-900/70 min-h-[420px] shadow-fp-glow">
      {bg ? <img src={bg} alt="hero" className="absolute inset-0 h-full w-full object-cover opacity-65" /> : null}
      <div className="absolute inset-0 bg-gradient-to-r from-[#040b18] via-[#050d1e]/85 to-transparent" />
      <div className="relative z-10 p-8 md:p-12 max-w-3xl space-y-5">
        <span className="inline-flex px-3 py-1 rounded-full text-xs tracking-[0.24em] uppercase border border-white/20 bg-white/10">Cine premium</span>
        <h2 className="text-4xl md:text-6xl font-black leading-[0.95] text-white">{title}</h2>
        {tags.length ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-200/90">
            {tags.map((i) => <span key={i} className="rounded-full border border-white/20 bg-white/10 px-3 py-1">{i}</span>)}
          </div>
        ) : null}
        {overview ? <p className="text-slate-200/90 max-w-2xl">{overview}</p> : null}
        {cast.length ? <p className="text-xs text-sky-200/90">Reparto: {cast.join(", ")}</p> : null}
        <div className="flex flex-wrap gap-3">
          <a href={hero?.stream_id ? `/play/movie/${hero.stream_id}` : "#"} className="rounded-xl bg-fp-accent px-6 py-3 font-semibold text-white transition duration-300 hover:shadow-fp-button">Ver ahora</a>
          <a href="/app" className="rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white transition duration-300 hover:bg-white/20">Mas informacion</a>
          <button className="rounded-xl border border-sky-300/40 bg-sky-400/10 px-6 py-3 font-semibold text-sky-100 transition duration-300 hover:shadow-fp-button">Agregar a favoritos</button>
        </div>
      </div>
    </section>
  );
}

function QuickAccess({ setPage }) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {quickAccess.map((item) => (
        <button
          key={item.key}
          onClick={() => setPage(item.key === "continue" ? "home" : item.key)}
          className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-sky-300/40 hover:shadow-fp-card"
        >
          <div className="text-2xl mb-3">{item.icon}</div>
          <p className="font-semibold text-white">{item.label}</p>
          <p className="text-xs text-slate-300">{item.detail}</p>
          <p className="mt-3 text-sky-300 font-semibold">{item.metric}</p>
        </button>
      ))}
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

function HoverCards({ title, items = [], type = "movie", limit = 10, hideTitle = false, imageOverrides = {}, metaOverrides = {} }) {
  return (
    <section>
      {!hideTitle && <h3 className="fp-section-title">{title}</h3>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {items.slice(0, limit).map((it, i) => {
          const id = it.stream_id || it.series_id || it.id;
          const href = type === "series" ? `/play/series/${id}` : `/play/movie/${id}`;
          const img = imageOverrides[id] || it.stream_icon || it.cover;
          const meta = metaOverrides[id] || {};
          const synopsis = meta.overview || it.plot || it.description || `Disfruta ${it.name || "este contenido"} en FastnetPlayer.`;
          return (
            <a key={`${id}-${i}`} href={href} className="group relative rounded-xl overflow-hidden border border-white/10 bg-slate-900/40 aspect-[2/3]">
              {img ? (
                <div className="h-full w-full p-1 bg-slate-950/70">
                  <img src={img} alt="" className="h-full w-full object-contain transition duration-300 group-hover:scale-105" />
                </div>
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 p-4 flex flex-col justify-end">
                <p className="text-white font-semibold line-clamp-1">{it.name}</p>
                <p className="text-xs text-slate-300 line-clamp-2">{synopsis}</p>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="rounded-md bg-fp-accent px-2 py-1">Reproducir</span>
                  <span className="rounded-md border border-white/30 px-2 py-1">Favorito</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function CatalogSection({ title, items = [], categories = [], type = "movie" }) {
  const [categoryId, setCategoryId] = useState("all");
  const [imageOverrides, setImageOverrides] = useState({});
  const [metaOverrides, setMetaOverrides] = useState({});
  const filteredItems = useMemo(() => {
    if (categoryId === "all") return items;
    return items.filter((it) => String(it.category_id ?? "") === String(categoryId));
  }, [items, categoryId]);

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

  return (
    <section className="space-y-4">
      <h3 className="fp-section-title">{title}</h3>
      <div className="flex gap-2 overflow-x-auto fp-no-scrollbar pb-1">
        <button
          onClick={() => setCategoryId("all")}
          className={`px-4 py-2 rounded-xl border text-sm whitespace-nowrap transition duration-300 ${
            categoryId === "all" ? "bg-sky-500/25 border-sky-300/40 text-white" : "border-white/10 text-slate-300 hover:bg-white/10"
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category_id}
            onClick={() => setCategoryId(cat.category_id)}
            className={`px-4 py-2 rounded-xl border text-sm whitespace-nowrap transition duration-300 ${
              String(categoryId) === String(cat.category_id) ? "bg-sky-500/25 border-sky-300/40 text-white" : "border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {cat.category_name}
          </button>
        ))}
      </div>
      <HoverCards
        title={`${title} (${filteredItems.length})`}
        items={filteredItems}
        type={type}
        limit={filteredItems.length || 0}
        hideTitle
        imageOverrides={imageOverrides}
        metaOverrides={metaOverrides}
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

function HomeBannerCard({ banner, featured = false, compact = false }) {
  if (!banner) return null;

  const href = banner.content_type === "url"
    ? banner.action_url
    : banner.external_id
      ? `/play/${banner.content_type}/${banner.external_id}`
      : banner.action_url;

  const image = proxiedImageUrl(banner.image_url || banner.mobile_image_url);
  const title = banner.title || "Banner";
  const subtitle = banner.subtitle || "";
  const external = Boolean(href && /^https?:\/\//i.test(href));

  return (
    <a
      href={href || "#"}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`group relative block w-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/60 shadow-fp-soft transition duration-300 hover:-translate-y-1 hover:border-sky-300/30 ${featured ? "min-h-[260px] md:min-h-[340px]" : compact ? "min-h-[150px] md:min-h-[170px]" : "min-h-[180px]"}`}
    >
      {image ? <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-300 group-hover:scale-[1.03]" /> : null}
      <div className="absolute inset-0 bg-gradient-to-r from-[#04101f] via-[#04101f]/80 to-transparent" />
      <div className={`relative z-10 flex h-full flex-col justify-end ${featured ? "p-5 md:p-7" : "p-4 md:p-5"}`}>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-100">
            {banner.content_type}
          </span>
          {banner.position !== undefined ? (
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-100">
              Pos {banner.position}
            </span>
          ) : null}
        </div>
        <h3 className={`${featured ? "text-3xl md:text-5xl" : compact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"} font-black leading-[0.95] text-white`}>
          {title}
        </h3>
        {subtitle ? <p className={`${featured ? "mt-3 max-w-2xl" : "mt-2"} text-sm text-slate-200/90`}>{subtitle}</p> : null}
        <div className={`${featured ? "mt-5" : "mt-4"} inline-flex items-center gap-2 text-sm font-semibold text-cyan-100`}>
          <span className="rounded-xl bg-sky-500/20 px-4 py-2 border border-sky-300/20">Abrir banner</span>
          <span className="text-xs uppercase tracking-[0.18em] text-slate-300">referencia externa</span>
        </div>
      </div>
    </a>
  );
}

function HomeSectionItemCard({ item, variant = "default" }) {
  const title = getSectionItemTitle(item);
  const href = getSectionItemHref(item);
  const external = Boolean(href && /^https?:\/\//i.test(href));
  const image = proxiedImageUrl(item.custom_image);
  const description =
    item.overview ||
    item.description ||
    item.plot ||
    item.synopsis ||
    item.summary ||
    `Disfruta ${title} desde FastPlayer.`;
  const isFeature = variant === "feature";
  const isCompact = variant === "compact";

  return (
    <a
      href={href || "#"}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-sky-300/30 hover:shadow-fp-card ${isFeature ? "relative block w-full min-h-[160px] md:min-h-[210px]" : ""}`}
    >
      {isFeature ? (
        <>
          {image ? (
            <img
              src={image}
              alt={title}
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-center">
              <div>
                <p className="text-2xl font-black text-sky-200">{String(item.content_type || "").toUpperCase()}</p>
                <p className="mt-2 text-xs text-slate-400 break-all">{item.external_id}</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#04101f]/35 via-[#04101f]/12 to-[#04101f]/35" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#030814]/60 via-[#030814]/18 to-transparent" />
          <div className="relative z-10 flex h-full min-h-[160px] flex-col justify-between p-4 md:min-h-[210px] md:p-6">
            <div className="space-y-2 md:max-w-[68%]">
              <div className="flex flex-wrap gap-2">
                {item.badge ? (
                  <span className="rounded-full bg-sky-500/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-lg">
                    {item.badge}
                  </span>
                ) : null}
                <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-100">
                  {item.content_type}
                </span>
              </div>
              <p className="text-lg font-black leading-[0.95] text-white md:text-3xl">{title}</p>
            </div>
            <div className="space-y-2 md:max-w-[60%]">
              <p className="line-clamp-2 text-xs leading-5 text-slate-100/90 md:text-sm">
                {description}
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300">
                {item.content_type} · {item.external_id}
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={`relative bg-slate-900/70 ${isCompact ? "aspect-[16/10]" : "aspect-[2/3]"}`}>
            {image ? (
              <img src={image} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-center">
                <div>
                  <p className="text-2xl font-black text-sky-200">{String(item.content_type || "").toUpperCase()}</p>
                  <p className="mt-2 text-xs text-slate-400 break-all">{item.external_id}</p>
                </div>
              </div>
            )}
            {item.badge ? (
              <span className="absolute left-3 top-3 rounded-full bg-sky-500/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-lg">
                {item.badge}
              </span>
            ) : null}
          </div>
          <div className="space-y-1 p-4">
            <p className="line-clamp-1 font-black text-white">{title}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              {item.content_type} · {item.external_id}
            </p>
          </div>
        </>
      )}
    </a>
  );
}

function HomeSectionBlock({ section }) {
  const items = Array.isArray(section?.items) ? section.items.filter(Boolean) : [];
  if (!items.length) return null;

  const layout = section.layout || "carousel";

  const renderItems = () => {
    if (layout === "grid") {
      return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {items.map((item) => (
            <HomeSectionItemCard key={item.id || item.external_id} item={item} variant="compact" />
          ))}
        </div>
      );
    }

    if (items.length === 2) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <HomeSectionItemCard key={item.id || item.external_id} item={item} variant="feature" />
          ))}
        </div>
      );
    }

    if (layout === "hero" || items.length === 1) {
      const [lead, ...rest] = items;
      if (items.length === 1) {
        return <HomeSectionItemCard item={lead} variant="feature" />;
      }

      return (
        <div className="space-y-4">
          <HomeSectionItemCard item={lead} variant="feature" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rest.slice(0, 6).map((item) => (
              <HomeSectionItemCard key={item.id || item.external_id} item={item} variant="compact" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid auto-cols-[180px] grid-flow-col gap-3 overflow-x-auto pb-2 fp-no-scrollbar">
        {items.map((item) => (
          <div key={item.id || item.external_id} className="w-[180px]">
            <HomeSectionItemCard item={item} variant="compact" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="fp-section-title">{section.title}</h3>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
            {section.content_type} · {items.length} items
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
          {layout}
        </span>
      </div>
      {renderItems()}
    </section>
  );
}

function HomeLike({ home, isLoading, error, onRetry }) {
  const banners = home?.banners || [];
  const sections = (home?.sections || []).filter((section) => Array.isArray(section.items) && section.items.length > 0);
  const settings = Object.fromEntries(
    Object.entries(home?.settings || {}).filter(([key]) => key && String(key).trim().length > 0),
  );
  const appName = settings.app_name || "FastPlayer";
  const playerDefault = settings.player_default || "auto";
  const showSkeleton = isLoading && !home;

  if (error && !home) {
    return (
      <section className="rounded-[28px] border border-rose-300/20 bg-rose-500/10 p-8 text-white">
        <p className="text-xl font-black">No se pudo cargar el home</p>
        <p className="mt-2 text-sm text-rose-100/90">{error}</p>
        <button onClick={onRetry} className="mt-5 rounded-xl bg-fp-accent px-5 py-3 font-semibold text-white transition hover:shadow-fp-button">
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {showSkeleton ? (
        <section className="rounded-[28px] border border-white/10 min-h-[420px] p-8 md:p-12 space-y-5 bg-slate-900/40">
          <div className="fp-skeleton h-8 w-36 rounded-full" />
          <div className="fp-skeleton h-14 w-[60%] rounded-xl" />
          <div className="fp-skeleton h-5 w-[45%] rounded-lg" />
          <div className="flex gap-3 pt-2">
            <div className="fp-skeleton h-12 w-32 rounded-xl" />
            <div className="fp-skeleton h-12 w-40 rounded-xl" />
            <div className="fp-skeleton h-12 w-48 rounded-xl" />
          </div>
        </section>
      ) : (
        <>
          {banners.length ? (
            <section className="space-y-4">
              {banners.length === 1 ? (
                <HomeBannerCard banner={banners[0]} featured />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {banners.map((banner) => (
                    <HomeBannerCard key={banner.id || banner.title} banner={banner} featured />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
              <span>{appName}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200 normal-case tracking-normal">
                banners: {banners.length}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200 normal-case tracking-normal">
                secciones: {sections.length}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200 normal-case tracking-normal">
                player: {playerDefault}
              </span>
            </div>
            <div className="space-y-4">
              {sections.length ? (
                <div className="space-y-6">
                  {sections.map((section) => (
                    <HomeSectionBlock key={section.id || section.slug} section={section} />
                  ))}
                </div>
              ) : (
                <section className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-slate-300">
                  No hay secciones activas con items por ahora.
                </section>
              )}
            </div>
          </section>

        </>
      )}
      <footer className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-5 text-sm text-slate-300 flex flex-wrap items-center justify-between">
        <p>FastPlayer Premium Experience</p>
        <p>Peliculas y series premium - Catalogo dinamico - Entretenimiento exclusivo</p>
      </footer>
    </div>
  );
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
  const [data, setData] = useState({
    home: null,
    homeLoading: false,
    homeError: null,
    movies: null,
    movieCategories: [],
    series: null,
    seriesCategories: [],
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

  const setPlayerMode = (mode) => {
    const nextMode = mode === "vlc" ? "vlc" : "internal";
    setPlayerModeState(nextMode);
    setDesktopPlayerMode(nextMode);
  };

  useEffect(() => {
    if (!auth.ok) return;
    if (page === "movies" && !data.movies) api("/movies").then((d) => setData((s) => ({ ...s, movies: d.items || [], movieCategories: d.categories || [] })));
    if (page === "series" && !data.series) api("/series").then((d) => setData((s) => ({ ...s, series: d.items || [], seriesCategories: d.categories || [] })));
  }, [auth.ok, page]);

  const onLogout = async () => {
    await api("/logout", { method: "POST" });
    setAuth({ ready: true, ok: false, user: null });
  };

  if (!auth.ready) return <div className="min-h-screen grid place-items-center text-white bg-fp-night">Cargando...</div>;
  if (!auth.ok) return <Login onDone={() => { window.location.href = "/app"; }} />;

  return (
    <div className="h-screen bg-fp-night text-white p-4 md:p-6 overflow-hidden">
      <div className="max-w-[1700px] mx-auto flex gap-6 min-w-0 h-full">
        <Side page={page} setPage={setPage} onLogout={onLogout} user={auth.user} desktopMode={desktopMode} playerMode={playerMode} />
        <main className="flex-1 space-y-6 min-w-0 h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden pr-1 fp-no-scrollbar">
          {page === "home" && (
            <HomeLike
              home={data.home}
              isLoading={data.homeLoading}
              error={data.homeError}
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
          {page === "movies" && <CatalogSection title="Peliculas" items={data.movies || []} categories={data.movieCategories || []} type="movie" />}
          {page === "series" && (
            SERIES_DEGRADED_MODE ? (
              <section className="space-y-4">
                <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-amber-100 text-sm">
                  Modo beta: algunas series pueden cargar mal o incompletas temporalmente.
                </div>
                <CatalogSection title="Series" items={(data.series || []).slice(0, 2)} categories={data.seriesCategories || []} type="series" />
              </section>
            ) : (
              <CatalogSection title="Series" items={data.series || []} categories={data.seriesCategories || []} type="series" />
            )
          )}
          {page === "settings" && <SettingsPanel desktopMode={desktopMode} playerMode={playerMode} setPlayerMode={setPlayerMode} hasVlc={hasVlc} />}
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById("app")).render(<App />);
