export function proxiedImageUrl(url) {
  if (!url) return "";
  if (/^\/|^data:|^blob:/i.test(String(url))) return url;
  // TMDB ya es https y permite cargarlo directo; asi no pasa por el servidor (que atiende de a una peticion en local).
  if (/^https:\/\/image\.tmdb\.org\//i.test(String(url))) return url;
  return `/image-proxy?url=${encodeURIComponent(url)}`;
}

export function getSectionItemHref(item = {}) {
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

export function getSectionItemTitle(item = {}) {
  return item.custom_title || item.title || item.name || item.external_id || "Contenido";
}

const MOVIE_ONLY_TYPES = new Set(["movie", "movies", "vod", "url"]);

export function isMovieOnlyContent(type) {
  if (!type) return true;
  return MOVIE_ONLY_TYPES.has(String(type).toLowerCase());
}

export function getContentLabel(type) {
  const value = String(type || "").toLowerCase();
  if (value === "movie" || value === "movies" || value === "vod") return "Pelicula";
  if (value === "url") return "Coleccion";
  if (value === "mixed") return "Seleccion";
  return "Contenido";
}

export function isTmdbImage(url) {
  return /image\.tmdb\.org\/t\/p\//i.test(String(url || ""));
}

// El panel entrega posters de TMDB en w400; pedimos el tamano que necesite cada uso.
export function tmdbSize(url, size) {
  return String(url || "").replace(/\/t\/p\/(w\d+|original)\//i, `/t/p/${size}/`);
}
