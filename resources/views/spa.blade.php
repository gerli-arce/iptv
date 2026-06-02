<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Fastnet Player</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    @vite(['resources/css/app.css', 'resources/js/spa.jsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
