{{-- Fastnet Player como aplicacion instalable (PWA): manifest, ajustes para iPhone y service worker. --}}
<link rel="manifest" href="/manifest.json">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Fastnet">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<script>
    // Guarda el aviso de instalacion del navegador para ofrecerlo desde un boton propio.
    window.__pwa = { prompt: null };
    window.addEventListener('beforeinstallprompt', function (event) {
        event.preventDefault();
        window.__pwa.prompt = event;
        window.dispatchEvent(new Event('pwa:change'));
    });
    window.addEventListener('appinstalled', function () {
        window.__pwa.prompt = null;
        window.dispatchEvent(new Event('pwa:change'));
    });
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('/sw.js').catch(function () {});
        });
    }
</script>
