@php
    $site = rtrim((string) config('app.site_url'), '/');
    $url = $site . '/prueba-gratis';
    $title = 'Prueba gratis 30 días | Fastnet Player';
    $description = 'Crea tu usuario de Fastnet Player gratis por 30 días, sin compromiso y sin tarjeta. Canales en vivo, películas y series en tu celular o Smart TV.';
@endphp
<!doctype html>
<html lang="es-PE">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="trial-enabled" content="1">
    <title>{{ $title }}</title>
    <meta name="description" content="{{ $description }}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{{ $url }}">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Fastnet Player">
    <meta property="og:locale" content="es_PE">
    <meta property="og:title" content="{{ $title }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:url" content="{{ $url }}">
    <meta property="og:image" content="{{ $site }}/og-image.png">
    <meta name="twitter:card" content="summary_large_image">

    @include('partials.favicon')
    @include('partials.pwa')

    <script>document.documentElement.classList.add('js')</script>
    <style>
        html, body { background: #08080b; }
        #boot-splash { display: none; position: fixed; inset: 0; z-index: 50; place-items: center; background: #08080b; }
        #boot-splash img { width: min(46vw, 170px); height: auto; animation: bootPulse 1.2s ease-in-out infinite; }
        .js #boot-splash { display: grid; }
        @keyframes bootPulse { 0%, 100% { opacity: .55; transform: scale(.94); } 50% { opacity: 1; transform: scale(1); } }
    </style>

    <link rel="preload" as="image" href="/logo-fastnet-wordmark.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/trial.jsx'])
</head>
<body>
    <div id="app">
        <div id="boot-splash" aria-hidden="true">
            <img src="/logo-fastnet-wordmark.png" alt="" width="636" height="344">
        </div>
        <noscript>
            <p style="color:#e4e4e7;font-family:sans-serif;text-align:center;padding:4rem 1rem">
                Crea tu usuario de Fastnet Player gratis por 30 días. Activa JavaScript para llenar el formulario.
            </p>
        </noscript>
    </div>
</body>
</html>
