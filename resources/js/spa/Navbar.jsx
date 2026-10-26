import { useEffect, useRef, useState } from "react";
import { Clapperboard, Film, Home, LogOut, Search, Settings, Tv, X } from "lucide-react";

export const NAV_ITEMS = [
  { key: "home", label: "Inicio", Icon: Home },
  { key: "live", label: "TV en vivo", Icon: Tv },
  { key: "movies", label: "Peliculas", Icon: Film },
  { key: "series", label: "Series", Icon: Clapperboard },
];

export function Navbar({ page, setPage, searchQuery, setSearchQuery, user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const displayName = user?.name || user?.username || "Usuario";
  const status = user?.status || "Activo";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const go = (key) => {
    setPage(key);
    setMenuOpen(false);
  };

  const solid = scrolled || menuOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        solid ? "border-b border-white/[0.07] bg-[#0a0a0d]/90 backdrop-blur-xl" : "bg-gradient-to-b from-black/80 via-black/30 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-4 px-4 md:h-[72px] md:gap-8 md:px-10">
        <button onClick={() => go("home")} className="flex shrink-0 items-center gap-2.5" aria-label="Inicio">
          <img src="/logo-fastnet-player.png" alt="Fastnet Player" className="size-9 rounded-[10px] shadow-[0_0_18px_rgba(255,60,60,0.35)] md:size-10" />
          <span className="hidden text-base font-bold tracking-tight text-white sm:block">FastnetPlayer</span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => go(key)}
              className={`relative rounded-md px-3.5 py-2 text-sm font-medium transition ${
                page === key ? "text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              {label}
              {page === key ? <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-coral" /> : null}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div
            className={`flex items-center overflow-hidden rounded-lg border transition-all duration-300 ${
              searchOpen || searchQuery
                ? "w-44 border-white/15 bg-black/60 sm:w-64 md:w-72"
                : "w-9 border-transparent bg-transparent md:w-10"
            }`}
          >
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="grid size-9 shrink-0 place-items-center text-zinc-300 transition hover:text-white md:size-10"
              aria-label="Buscar"
            >
              <Search className="size-[18px]" />
            </button>
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => !searchQuery && setSearchOpen(false)}
              placeholder="Titulos, peliculas..."
              className="w-full min-w-0 bg-transparent pr-2 text-sm text-white outline-none placeholder:text-zinc-500"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchOpen(false);
                }}
                className="mr-1 grid size-6 shrink-0 place-items-center rounded text-zinc-400 hover:text-white"
                aria-label="Limpiar busqueda"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-white/[0.06]"
              aria-label="Cuenta"
            >
              <span className="grid size-8 place-items-center rounded-md bg-coral text-sm font-bold text-white md:size-9">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0d0d11] shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                <div className="border-b border-white/[0.07] px-4 py-3.5">
                  <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Suscripcion {status}
                  </p>
                </div>
                <div className="p-1.5">
                  <button onClick={() => go("settings")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.06]">
                    <Settings className="size-4 text-zinc-400" />
                    Ajustes
                  </button>
                  <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-rose-500/10 hover:text-rose-200">
                    <LogOut className="size-4 text-zinc-400" />
                    Cerrar sesion
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export function MobileNav({ page, setPage }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-[#0a0a0d]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5">
        {[...NAV_ITEMS, { key: "settings", label: "Ajustes", Icon: Settings }].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setPage(key)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
              page === key ? "text-coral" : "text-zinc-500"
            }`}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
