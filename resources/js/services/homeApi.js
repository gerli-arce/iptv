const DEFAULT_HOME_API_URL = "/api/home";

export function getHomeApiUrl() {
  return import.meta.env.VITE_HOME_API_URL || DEFAULT_HOME_API_URL;
}

export async function fetchHomeData() {
  const url = getHomeApiUrl();
  console.log("HOME_API_LOADING", { url });

  try {
    const response = await fetch(url, {
      credentials: "same-origin",
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
