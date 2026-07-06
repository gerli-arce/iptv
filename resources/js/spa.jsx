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

const WEB_PAGES = new Set(["home", "movies", "series", "settings"]);

const PAGE_META = {
  home: { title: "Inicio", subtitle: "Estrenos, destacadas y acceso rapido a tu catalogo de peliculas." },
  movies: { title: "Peliculas", subtitle: "Explora el catalogo completo con una portada mas limpia y enfocada en cine." },
  series: { title: "Series", subtitle: "Encuentra temporadas y series destacadas en una vista dedicada." },
  settings: { title: "Ajustes", subtitle: "Cuenta, sesion y preferencias del reproductor." },
};

const NAV_ITEMS = [
  { key: "home", label: "Inicio", icon: "home" },
  { key: "movies", label: "Peliculas", icon: "movies" },
  { key: "series", label: "Series", icon: "series" },
  { key: "settings", label: "Ajustes", icon: "settings" },
];

const MOVIE_ONLY_TYPES = new Set(["movie", "movies", "vod", "url"]);

function isMovieOnlyContent(type) {
  if (!type) return true;
  return MOVIE_ONLY_TYPES.has(String(type).toLowerCase());
}

function getContentLabel(type) {
  const value = String(type || "").toLowerCase();
  if (value === "movie" || value === "movies" || value === "vod") return "Pelicula";
  if (value === "url") return "Coleccion";
  if (value === "mixed") return "Seleccion";
  return "Contenido";
}

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

function Side({ page, setPage, onLogout, user, desktopMode, playerMode, collapsed, setCollapsed }) {
  const links = NAV_ITEMS;

  const displayName = user?.name || user?.username || "Usuario";
  const subscription = user?.status || "Activo";
  const expiry = user?.exp_date || user?.expiry || user?.exp || "";

  return (
    <aside
      className={`hidden xl:flex shrink-0 flex-col rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-fp-soft h-[calc(100vh-2rem)] sticky top-4 overflow-hidden transition-all duration-300 ${
        collapsed ? "w-[92px] p-3" : "w-[300px] p-4"
      }`}
    >
      <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div className={`rounded-2xl border border-white/10 bg-black/20 ${collapsed ? "p-2" : "p-3"} overflow-hidden`}>
            <img
              src="/logo fast_tv.png"
              alt="Fastnet Player"
              className={`${collapsed ? "w-16" : "w-full"} h-auto rounded-xl object-cover`}
            />
          </div>
          <button
            onClick={() => setCollapsed?.(!collapsed)}
            className="mt-1 inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-100 transition duration-300 hover:border-sky-300/40 hover:bg-sky-400/10 hover:text-white"
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <Icon name={collapsed ? "expand" : "collapse"} className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-sky-300/15 bg-gradient-to-br from-sky-500/10 via-white/[0.03] to-transparent p-4">
        <p className="text-[10px] uppercase tracking-[0.28em] text-sky-200/80">Perfil</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 text-sm font-black text-white shadow-[0_0_25px_rgba(37,99,235,0.4)]">
            {(displayName || "U").slice(0, 1).toUpperCase()}
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <p className="text-xs text-emerald-300">Suscripcion {subscription}</p>
              {expiry ? <p className="text-[11px] text-slate-400">Expira: {expiry}</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      <nav className="mt-5 space-y-2">
        {links.map((item) => {
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition duration-300 ${
                active
                  ? "border-sky-300/35 bg-sky-400/12 text-white shadow-[0_0_35px_rgba(37,99,235,0.15)]"
                  : "border-transparent text-slate-200 hover:border-sky-300/20 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl transition duration-300 ${
                  active ? "bg-sky-400/15 text-sky-200 shadow-[0_0_24px_rgba(37,99,235,0.25)]" : "bg-white/[0.04] text-slate-300 group-hover:bg-sky-400/10 group-hover:text-sky-100"
                }`}
              >
                <Icon name={item.icon} className="size-5" />
              </span>
              {!collapsed ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.label}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    {active ? "Activo" : "Abrir"}
                  </p>
                </div>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        {desktopMode && !collapsed ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Reproductor</p>
            <p className="mt-2 text-sm font-semibold text-white">
              {playerMode === "vlc" ? "VLC externo" : "Interno"}
            </p>
          </div>
        ) : null}
        <button
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-white transition duration-300 hover:border-rose-300/30 hover:bg-rose-500/10 ${collapsed ? "px-3" : "px-4"}`}
          onClick={onLogout}
        >
          <Icon name="plus" className="size-4 rotate-45" />
          {!collapsed ? <span>Cerrar sesion</span> : null}
        </button>
      </div>
    </aside>
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
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 text-lg font-black text-white shadow-[0_0_25px_rgba(37,99,235,0.35)]">
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

function TopHeader({ page, searchQuery, setSearchQuery, user, now, notifications = 0 }) {
  const meta = PAGE_META[page] || PAGE_META.home;
  const timestamp = now
    ? now.toLocaleString("es-PE", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const displayName = user?.name || user?.username || "Usuario";

  return (
    <header className="sticky top-3 z-20 rounded-[24px] border border-white/10 bg-white/[0.05] px-3 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl md:top-4 md:rounded-[28px] md:px-5 md:py-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400 sm:text-xs sm:tracking-[0.24em]">
              <span>FastPlayer</span>
              <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-sky-100">Solo peliculas</span>
            </div>
            <h1 className="mt-1.5 text-xl font-black text-white md:mt-2 md:text-3xl">{meta.title}</h1>
            <p className="mt-1 max-w-xl text-xs text-slate-300 md:text-sm">{meta.subtitle}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2 md:px-3">
            <button className="relative grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition duration-300 hover:border-sky-300/35 hover:bg-sky-500/10 hover:text-white">
              <Icon name="bell" className="size-4.5 md:size-5" />
              {notifications > 0 ? (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
              ) : null}
            </button>

            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-700 text-sm font-black text-white">
              {displayName.slice(0, 1).toUpperCase()}
            </div>

            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-emerald-300">Activo</p>
                <span className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-500 lg:inline">{timestamp}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 transition duration-300 focus-within:border-sky-300/35 focus-within:bg-sky-500/8 md:px-4 md:py-3">
            <Icon name="search" className="size-4.5 text-slate-400 group-focus-within:text-sky-200 md:size-5" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar peliculas o series..."
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500 md:text-sm"
            />
          </label>
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav({ page, setPage }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 xl:hidden">
      <div className="grid grid-cols-4 gap-2 rounded-[26px] border border-white/10 bg-slate-950/90 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        {NAV_ITEMS.map((item) => {
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-[11px] font-semibold transition duration-300 ${
                active ? "bg-sky-400/14 text-white" : "text-slate-400"
              }`}
            >
              <Icon name={item.icon} className="size-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
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
  const items = [
    { key: "movies", label: "Peliculas", icon: "movies", detail: "Catalogo premium", metric: "Estrenos" },
    { key: "series", label: "Series", icon: "series", detail: "Temporadas y episodios", metric: "Explorar" },
    { key: "settings", label: "Ajustes", icon: "settings", detail: "Cuenta y sesion", metric: "Perfil" },
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => setPage(item.key)}
          className="group flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-sky-300/40 hover:shadow-fp-card"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-400/12 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Icon name={item.icon} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-white">{item.label}</p>
            <p className="text-xs text-slate-300">{item.detail}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">{item.metric}</p>
          </div>
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.slice(0, limit).map((it, i) => {
          const id = it.stream_id || it.series_id || it.id;
          const href = type === "series" ? `/play/series/${id}` : `/play/movie/${id}`;
          const img = imageOverrides[id] || it.stream_icon || it.cover;
          const meta = metaOverrides[id] || {};
          const synopsis = meta.overview || it.plot || it.description || `Disfruta ${it.name || "este contenido"} en FastnetPlayer.`;
          const year = (meta.release_date || it.release_date || it.first_air_date || "").slice(0, 4);
          const rating = meta.vote_average ? Number(meta.vote_average).toFixed(1) : "";
          return (
            <a
              key={`${id}-${i}`}
              href={href}
              className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-900/40 aspect-[2/3] shadow-fp-card transition duration-300 hover:-translate-y-1 hover:border-sky-300/30"
            >
              {img ? (
                <div className="h-full w-full bg-slate-950/70">
                  <img src={img} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#030814]/95 via-[#030814]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-100/90">
                  {rating ? <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1">★ {rating}</span> : null}
                  {year ? <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1">{year}</span> : null}
                  <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1">{type}</span>
                </div>
                <p className="mt-3 text-lg font-black leading-[0.96] text-white line-clamp-2">{it.name}</p>
                <p className="mt-2 text-xs leading-5 text-slate-200/85 line-clamp-2">{synopsis}</p>
                <div className="mt-3 flex gap-2 text-xs">
                  <span className="rounded-xl bg-fp-accent px-3 py-2 font-semibold text-white">Reproducir</span>
                  <span className="rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-slate-100">Detalles</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
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
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="fp-section-title">{title}</h3>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
            {filteredItems.length} resultados
          </p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto fp-no-scrollbar pb-1">
        <button
          onClick={() => setCategoryId("all")}
          className={`px-4 py-2 rounded-xl border text-sm whitespace-nowrap transition duration-300 backdrop-blur ${
            categoryId === "all" ? "bg-sky-500/25 border-sky-300/40 text-white" : "border-white/10 text-slate-300 hover:bg-white/10"
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category_id}
            onClick={() => setCategoryId(cat.category_id)}
            className={`px-4 py-2 rounded-xl border text-sm whitespace-nowrap transition duration-300 backdrop-blur ${
              String(categoryId) === String(cat.category_id) ? "bg-sky-500/25 border-sky-300/40 text-white" : "border-white/10 text-slate-300 hover:bg-white/10"
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
      className={`group relative block w-full overflow-hidden rounded-[26px] border border-white/10 bg-slate-900/60 shadow-fp-soft transition duration-300 hover:-translate-y-1 hover:border-sky-300/30 ${featured ? "min-h-[220px] md:min-h-[270px]" : compact ? "min-h-[150px] md:min-h-[170px]" : "min-h-[180px]"}`}
    >
      {image ? <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-300 group-hover:scale-[1.03]" /> : null}
      <div className="absolute inset-0 bg-gradient-to-r from-[#04101f]/96 via-[#04101f]/72 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030814]/65 via-transparent to-transparent" />
      <div className={`relative z-10 flex h-full flex-col justify-end ${featured ? "p-5 md:p-7" : "p-4 md:p-5"}`}>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-100">
            {getContentLabel(banner.content_type)}
          </span>
          {banner.position !== undefined ? (
            <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-sky-100">
              Pos {banner.position}
            </span>
          ) : null}
        </div>
        <h3 className={`${featured ? "text-3xl md:text-5xl" : compact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"} max-w-3xl font-black leading-[0.94] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]`}>
          {title}
        </h3>
        {subtitle ? <p className={`${featured ? "mt-3 max-w-2xl" : "mt-2"} text-sm text-slate-200/90 line-clamp-2`}>{subtitle}</p> : null}
        {featured ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!href) return;
                if (external) {
                  window.open(href, "_blank", "noreferrer");
                  return;
                }
                window.location.href = href;
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-fp-accent px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:shadow-fp-button"
            >
              <Icon name="play" className="size-4" />
              Ver ahora
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:border-sky-300/35 hover:bg-sky-500/10">
              <Icon name="plus" className="size-4" />
              Mi lista
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:border-sky-300/35 hover:bg-sky-500/10">
              <Icon name="info" className="size-4" />
              Mas informacion
            </button>
          </div>
        ) : (
          <div className={`${featured ? "mt-4" : "mt-3"} inline-flex items-center gap-2 text-sm font-semibold text-cyan-100`}>
            <span className="rounded-xl bg-sky-500/20 px-4 py-2 border border-sky-300/20">Reproducir</span>
            <span className="text-xs uppercase tracking-[0.18em] text-slate-300">catalogo premium</span>
          </div>
        )}
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
                <p className="text-2xl font-black text-sky-200">{getContentLabel(item.content_type)}</p>
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
                  {getContentLabel(item.content_type)}
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
                  <p className="text-2xl font-black text-sky-200">{getContentLabel(item.content_type)}</p>
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
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {items.map((item) => (
            <HomeSectionItemCard key={item.id || item.external_id} item={item} variant="compact" />
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
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {[lead, ...rest].slice(0, 6).map((item) => (
              <HomeSectionItemCard key={item.id || item.external_id} item={item} variant="compact" />
            ))}
          </div>
          <div className="hidden md:block">
            <HomeSectionItemCard item={lead} variant="feature" />
          </div>
          <div className="hidden gap-4 md:grid sm:grid-cols-2 xl:grid-cols-3">
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

function HomeLike({ home, isLoading, error, onRetry, searchQuery = "", setPage, movieCategories = [] }) {
  const q = searchQuery.trim().toLowerCase();
  const banners = (home?.banners || []).filter((banner) => {
    if (!isMovieOnlyContent(banner.content_type)) return false;
    if (!q) return true;
    return [banner.title, banner.subtitle, banner.content_type, banner.external_id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
  const sections = (home?.sections || [])
    .filter((section) => isMovieOnlyContent(section?.content_type))
    .map((section) => {
      const items = Array.isArray(section.items)
        ? section.items.filter((item) => item && isMovieOnlyContent(item.content_type))
        : [];
      const filteredItems = q
        ? items.filter((item) => {
            const text = [
              item.custom_title,
              item.title,
              item.name,
              item.badge,
              item.external_id,
              item.content_type,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return text.includes(q) || String(section.title || "").toLowerCase().includes(q);
          })
        : items;
      return { ...section, items: filteredItems };
    })
    .filter((section) => Array.isArray(section.items) && section.items.length > 0);
  const featuredMovies = (home?.movies || [])
    .filter(Boolean)
    .filter((item) => {
      if (!q) return true;
      return [item.name, item.plot, item.genre, item.year, item.category_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
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
    <div className="space-y-8">
      {showSkeleton ? (
        <section className="rounded-[32px] border border-white/10 min-h-[420px] p-8 md:p-12 space-y-5 bg-slate-900/40">
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
          <QuickAccess setPage={setPage} />

          {banners.length ? (
            <section className="space-y-4">
              {banners.length === 1 ? (
                <HomeBannerCard banner={banners[0]} featured />
              ) : (
                <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
                  <HomeBannerCard banner={banners[0]} featured />
                  <div className="grid gap-4">
                    {banners.slice(1, 3).map((banner) => (
                      <HomeBannerCard key={banner.id || banner.title} banner={banner} compact />
                    ))}
                  </div>
                </div>
              )}
              {banners.length > 3 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {banners.slice(3, 6).map((banner) => (
                    <HomeBannerCard key={banner.id || banner.title} banner={banner} compact />
                  ))}
                </div>
              ) : null}
            </section>
          ) : featuredMovies.length ? (
            <section className="space-y-4">
              <HeroSection hero={featuredMovies[0]} />
            </section>
          ) : null}

          {sections.length ? (
            <section className="space-y-6">
              <div className="space-y-8">
                {sections.map((section) => (
                  <HomeSectionBlock key={section.id || section.slug} section={section} />
                ))}
              </div>
            </section>
          ) : featuredMovies.length ? (
            <section className="space-y-6">
              <CatalogSection
                title="Peliculas recomendadas"
                items={featuredMovies}
                categories={movieCategories}
                type="movie"
                searchQuery={searchQuery}
              />
            </section>
          ) : (
            <section className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-slate-300">
              No hay peliculas destacadas por ahora.
            </section>
          )}

        </>
      )}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("fastnet:sidebarCollapsed") === "1");
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
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
  const mainScrollRef = useRef(null);
  const lastScrollTopRef = useRef(0);

  useEffect(() => {
    api("/me").then((m) => setAuth({ ready: true, ok: true, user: m.user })).catch(() => setAuth({ ready: true, ok: false, user: null }));
  }, []);

  useEffect(() => {
    localStorage.setItem("fastnet:lastPage", page);
  }, [page]);

  useEffect(() => {
    setIsHeaderVisible(true);
    lastScrollTopRef.current = 0;
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [page]);

  useEffect(() => {
    localStorage.setItem("fastnet:sidebarCollapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (WEB_PAGES.has(page)) return;
    setPage("home");
  }, [page]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

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
  }, [auth.ok, page, data.movies, data.series]);

  const onLogout = async () => {
    await api("/logout", { method: "POST" });
    setAuth({ ready: true, ok: false, user: null });
  };

  if (!auth.ready) return <div className="min-h-screen grid place-items-center text-white bg-fp-night">Cargando...</div>;
  if (!auth.ok) return <Login onDone={() => { window.location.href = "/app"; }} />;

  const handleMainScroll = (event) => {
    const currentTop = event.currentTarget.scrollTop;
    const lastTop = lastScrollTopRef.current;
    const delta = currentTop - lastTop;

    if (currentTop <= 24) {
      setIsHeaderVisible(true);
    } else if (delta > 6) {
      setIsHeaderVisible(false);
    } else if (delta < -6) {
      setIsHeaderVisible(true);
    }

    lastScrollTopRef.current = currentTop;
  };

  const movieCatalogItems = (data.movies && data.movies.length)
    ? data.movies
    : extractFallbackCatalogItems(data.home, "movie");
  const seriesCatalogItems = (data.series && data.series.length)
    ? data.series
    : extractFallbackCatalogItems(data.home, "series");

  return (
    <div className="relative h-screen overflow-hidden bg-fp-night text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 size-[28rem] rounded-full bg-sky-500/14 blur-[120px]" />
        <div className="absolute right-0 top-10 size-[24rem] rounded-full bg-blue-600/12 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-cyan-500/8 blur-[140px]" />
      </div>
      <div className="relative z-10 mx-auto flex h-full max-w-[1880px] gap-5 p-3 pb-24 md:p-6 md:pb-6 min-w-0">
        <Side
          page={page}
          setPage={setPage}
          onLogout={onLogout}
          user={auth.user}
          desktopMode={desktopMode}
          playerMode={playerMode}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-5">
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isHeaderVisible ? "max-h-64 translate-y-0 opacity-100" : "pointer-events-none max-h-0 -translate-y-3 opacity-0"
            }`}
          >
            <TopHeader
              page={page}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              user={auth.user}
              now={now}
              notifications={(data.home?.banners?.length || 0) + (data.home?.sections?.length || 0)}
            />
          </div>
          <main
            ref={mainScrollRef}
            onScroll={handleMainScroll}
            className="min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden pr-1 fp-no-scrollbar"
          >
            {page === "home" && (
              <HomeLike
                home={data.home}
                isLoading={data.homeLoading}
                error={data.homeError}
                searchQuery={searchQuery}
                setPage={setPage}
                movieCategories={data.movieCategories || []}
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
            {page === "movies" && (
              <CatalogSection
                title="Peliculas"
                items={movieCatalogItems}
                categories={data.movieCategories || []}
                type="movie"
                searchQuery={searchQuery}
              />
            )}
            {page === "series" && (
              <CatalogSection
                title="Series"
                items={seriesCatalogItems}
                categories={data.seriesCategories || []}
                type="series"
                searchQuery={searchQuery}
              />
            )}
            {page === "settings" && (
              <SettingsPanel
                desktopMode={desktopMode}
                playerMode={playerMode}
                setPlayerMode={setPlayerMode}
                hasVlc={hasVlc}
                user={auth.user}
                onLogout={onLogout}
              />
            )}
          </main>
        </div>
      </div>
      <MobileBottomNav page={page} setPage={setPage} />
    </div>
  );
}

createRoot(document.getElementById("app")).render(<App />);
