export function getHomeApiUrl() {
  return window.__FASTPLAYER_CONFIG__?.homeApiUrl || import.meta.env.VITE_HOME_API_URL || "";
}

// El servidor entrega el inicio con la imagen de fondo de cada destacado ya resuelta. Si falla, se pide directo al panel.
async function fetchHomeFeed() {
  const response = await fetch("/api/player/home-feed", { credentials: "same-origin", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function fetchHomeData() {
  try {
    const feed = await fetchHomeFeed();
    if (feed && (Array.isArray(feed.banners) || Array.isArray(feed.sections))) return feed;
  } catch {
    // Se usa la direccion directa del panel.
  }

  const url = getHomeApiUrl();

  if (!url) {
    throw new Error("VITE_HOME_API_URL no esta configurada");
  }

  console.log("HOME_API_LOADING", { url });

  try {
    const response = await fetch(url, {
      mode: "cors",
      credentials: "omit",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log("HOME_API_SUCCESS", {
      banners: Array.isArray(data?.banners) ? data.banners.length : 0,
      sections: Array.isArray(data?.sections) ? data.sections.length : 0,
    });

    return data;
  } catch (error) {
    console.error("HOME_API_ERROR", {
      url,
      message: error?.message || String(error),
    });
    throw error;
  }
}
