<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Fastnet Player</title>
    @include('partials.favicon')
    @include('partials.noindex')
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <script>
        window.__FASTPLAYER_CONFIG__ = {
            homeApiUrl: @json(config('app.home_api_url')),
        };
    </script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/spa.jsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
