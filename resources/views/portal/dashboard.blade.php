<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FastnetPlayer</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#030712] text-white">
@php
    $heroMovie = $movies[0] ?? null;
    $heroTmdbImage = !empty($heroTmdb['backdrop_path']) ? 'https://image.tmdb.org/t/p/original' . $heroTmdb['backdrop_path'] : null;
    $heroImage = $heroTmdbImage ?: ($heroMovie['stream_icon'] ?? null);
    $heroTitle = $heroTmdb['title'] ?? ($heroMovie['name'] ?? 'Destacado');
    $channelsTop = array_slice($channels, 0, 6);
    $moviesTop = array_slice($movies, 0, 12);
    $seriesTop = array_slice($series, 0, 12);
@endphp

<div class="min-h-screen grid grid-cols-1 lg:grid-cols-[240px_1fr]">
    <aside class="hidden lg:flex flex-col border-r border-white/10 bg-gradient-to-b from-[#060b1c] to-[#050916]">
        <div class="px-6 py-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500"></div>
            <h1 class="text-3xl font-bold">Fastnet<span class="text-violet-400">Player</span></h1>
        </div>
        <nav class="px-4 space-y-2 text-lg">
            <a class="block px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500" href="{{ route('portal.dashboard') }}">Inicio</a>
            <a class="block px-4 py-3 rounded-xl hover:bg-white/5" href="{{ route('portal.live') }}">TV en vivo</a>
            <a class="block px-4 py-3 rounded-xl hover:bg-white/5" href="{{ route('portal.movies') }}">Películas</a>
            <a class="block px-4 py-3 rounded-xl hover:bg-white/5" href="{{ route('portal.series') }}">Series</a>
            <a class="block px-4 py-3 rounded-xl hover:bg-white/5" href="#favoritos">Favoritos</a>
        </nav>
        <div class="mt-auto p-4">
            <form method="POST" action="{{ route('portal.logout') }}">
                @csrf
                <button class="w-full px-4 py-3 rounded-xl border border-white/20 hover:bg-white/5">Cerrar sesión</button>
            </form>
        </div>
    </aside>

    <main class="p-4 lg:p-6 space-y-6">
        <header class="flex items-center justify-between gap-3">
            <div class="w-full max-w-md bg-[#0b1224] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300">
                Buscar contenido...
            </div>
            <div class="text-right">
                <p class="text-lg font-semibold">{{ $userInfo['username'] ?? 'Usuario' }}</p>
                <p class="text-xs text-slate-400">En línea</p>
            </div>
        </header>

        <section id="inicio" class="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a1226]">
            <div class="aspect-[21/8]">
                @if($heroImage)
                    <img src="{{ $heroImage }}" class="w-full h-full object-cover" alt="hero">
                @endif
                <div class="absolute inset-0 bg-gradient-to-r from-[#030712] via-[#030712cc] to-transparent"></div>
                <div class="absolute left-5 top-5 lg:left-8 lg:top-8 max-w-xl">
                    <span class="inline-flex px-3 py-1 rounded-full bg-cyan-400 text-black text-xs font-bold">DESTACADO</span>
                    <h2 class="mt-3 text-5xl font-extrabold">{{ strtoupper($heroTitle) }}</h2>
                    <div class="mt-5 flex gap-3">
                        @if(!empty($heroMovie['stream_id']))
                            <a href="{{ route('portal.play', ['type' => 'movie', 'id' => $heroMovie['stream_id']]) }}" class="px-5 py-3 rounded-xl bg-white text-black font-semibold">Ver ahora</a>
                        @endif
                        @if(!empty($heroMovie['name']))
                            <a href="{{ url('/api/imdb/search?q=' . urlencode($heroMovie['name'])) }}" target="_blank" class="px-5 py-3 rounded-xl border border-white/30 bg-white/10">Más información</a>
                        @endif
                    </div>
                </div>
            </div>
        </section>

        <section class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="rounded-xl border border-white/10 bg-[#0b1224] p-4">TV en vivo</div>
            <div class="rounded-xl border border-white/10 bg-[#0b1224] p-4">Películas</div>
            <div class="rounded-xl border border-white/10 bg-[#0b1224] p-4">Series</div>
            <div class="rounded-xl border border-white/10 bg-[#0b1224] p-4">Favoritos</div>
        </section>

        <section id="tv">
            <h3 class="text-3xl font-bold mb-3">En vivo ahora</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                @foreach($channelsTop as $item)
                    <a href="{{ route('portal.play', ['type' => 'channel', 'id' => $item['stream_id'] ?? 0]) }}" class="group rounded-xl overflow-hidden border border-white/10 bg-[#0b1224]">
                        <div class="aspect-[3/4] overflow-hidden">
                            @if(!empty($item['stream_icon']))<img src="{{ $item['stream_icon'] }}" class="w-full h-full object-cover group-hover:scale-105 transition" alt="">@endif
                        </div>
                    </a>
                @endforeach
            </div>
        </section>

        <section id="peliculas">
            <h3 class="text-3xl font-bold mb-3">Recomendados para ti</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                @foreach($moviesTop as $item)
                    <a href="{{ route('portal.play', ['type' => 'movie', 'id' => $item['stream_id'] ?? 0]) }}" class="group rounded-xl overflow-hidden border border-white/10 bg-[#0b1224]">
                        <div class="aspect-[3/4] overflow-hidden">
                            @if(!empty($item['stream_icon']))<img src="{{ $item['stream_icon'] }}" class="w-full h-full object-cover group-hover:scale-105 transition" alt="">@endif
                        </div>
                    </a>
                @endforeach
            </div>
        </section>

        <section id="series">
            <h3 class="text-3xl font-bold mb-3">Series recomendadas</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                @foreach($seriesTop as $item)
                    <a href="{{ route('portal.play.series', ['seriesId' => $item['series_id'] ?? 0]) }}" class="group rounded-xl overflow-hidden border border-white/10 bg-[#0b1224]">
                        <div class="aspect-[3/4] overflow-hidden">
                            @if(!empty($item['cover']))<img src="{{ $item['cover'] }}" class="w-full h-full object-cover group-hover:scale-105 transition" alt="">@endif
                        </div>
                    </a>
                @endforeach
            </div>
        </section>
    </main>
</div>

</body>
</html>
