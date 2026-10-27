// Service worker de Fastnet Player. Solo guarda la parte visual (archivos compilados, iconos) para que la app abra
// rapido y muestre una pantalla "sin conexion". Nunca toca video, listas, API ni el proxy de streaming.
const VERSION = "fp-v1";
const SHELL = ["/offline.html", "/icon-192.png", "/logo-fastnet-wordmark.png"];

// Rutas que siempre van directo a la red.
const NETWORK_ONLY = /^\/(api|portal-api|stream|play|image-proxy|admin|livewire|sanctum)(\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || NETWORK_ONLY.test(url.pathname)) return;

  // Paginas: siempre la version de la red; sin internet, la pantalla de "sin conexion".
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  // Archivos compilados (llevan el hash en el nombre, nunca cambian): primero el guardado.
  if (url.pathname.startsWith("/build/assets/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Imagenes y tipografias propias: muestra lo guardado y lo actualiza en segundo plano.
  if (/\.(png|jpe?g|webp|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(VERSION).then((cache) =>
        cache.match(request).then((hit) => {
          const refresh = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => hit);
          return hit || refresh;
        }),
      ),
    );
  }
});
