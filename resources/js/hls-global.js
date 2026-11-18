// hls.js empaquetado con Vite para las vistas Blade del reproductor (la CSP no permite scripts de CDNs).
// Los scripts de esas vistas lo usan como window.Hls a partir de DOMContentLoaded.
import Hls from "hls.js";

window.Hls = Hls;
