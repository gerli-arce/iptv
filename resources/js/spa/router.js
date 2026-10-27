import { useCallback, useEffect, useMemo, useState } from "react";

// Cada vista tiene su propia URL, asi el boton "atras" del navegador vuelve a la vista anterior y se pueden compartir
// enlaces. Los filtros van en la direccion: ?categoria=ID, y el canal abierto en el reproductor: ?canal=ID.
export const PAGE_PATHS = {
  home: "/app",
  live: "/app/tv",
  movies: "/app/peliculas",
  series: "/app/series",
  settings: "/app/ajustes",
};

const PATH_PAGES = Object.fromEntries(Object.entries(PAGE_PATHS).map(([page, path]) => [path, page]));

export function pageFromPath(pathname) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return PATH_PAGES[clean] || "home";
}

const readLocation = () => ({ pathname: window.location.pathname, search: window.location.search });

export function useRoute() {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const onPop = () => setLocation(readLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // push por defecto; con replace se reemplaza la entrada actual del historial (no agrega un paso nuevo).
  const go = useCallback((to, { replace = false, state = {} } = {}) => {
    if (replace) window.history.replaceState({ ...window.history.state, ...state, app: true }, "", to);
    else window.history.pushState({ ...state, app: true }, "", to);
    setLocation(readLocation());
  }, []);

  const navigate = useCallback((page) => go(PAGE_PATHS[page] || PAGE_PATHS.home), [go]);

  // updates: { clave: valor | null }. null o "" quitan el parametro.
  const setParams = useCallback(
    (updates, options) => {
      const next = new URLSearchParams(window.location.search);
      Object.entries(updates).forEach(([key, value]) => (value == null || value === "" ? next.delete(key) : next.set(key, String(value))));
      const query = next.toString();
      go(`${window.location.pathname}${query ? `?${query}` : ""}`, options);
    },
    [go],
  );

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const page = pageFromPath(location.pathname);

  return { page, params, navigate, setParams, go };
}
