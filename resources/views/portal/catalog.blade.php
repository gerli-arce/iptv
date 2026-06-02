<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }} - FastnetPlayer</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#030712] text-white">
<div class="min-h-screen grid grid-cols-1 lg:grid-cols-[240px_1fr]">
    <aside class="hidden lg:flex flex-col border-r border-white/10 bg-gradient-to-b from-[#060b1c] to-[#050916]">
        <div class="px-6 py-6 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500"></div>
            <h1 class="text-3xl font-bold">Fastnet<span class="text-violet-400">Player</span></h1>
        </div>
        <nav class="px-4 space-y-2 text-lg">
            <a class="block px-4 py-3 rounded-xl {{ ($activePage ?? '') === 'home' ? 'bg-gradient-to-r from-violet-500 to-blue-500' : 'hover:bg-white/5' }}" href="{{ route('portal.dashboard') }}">Inicio</a>
            <a class="block px-4 py-3 rounded-xl {{ ($activePage ?? '') === 'live' ? 'bg-gradient-to-r from-violet-500 to-blue-500' : 'hover:bg-white/5' }}" href="{{ route('portal.live') }}">TV en vivo</a>
            <a class="block px-4 py-3 rounded-xl {{ ($activePage ?? '') === 'movies' ? 'bg-gradient-to-r from-violet-500 to-blue-500' : 'hover:bg-white/5' }}" href="{{ route('portal.movies') }}">Películas</a>
            <a class="block px-4 py-3 rounded-xl {{ ($activePage ?? '') === 'series' ? 'bg-gradient-to-r from-violet-500 to-blue-500' : 'hover:bg-white/5' }}" href="{{ route('portal.series') }}">Series</a>
        </nav>
        <div class="mt-auto p-4">
            <form method="POST" action="{{ route('portal.logout') }}">
                @csrf
                <button class="w-full px-4 py-3 rounded-xl border border-white/20 hover:bg-white/5">Cerrar sesión</button>
            </form>
        </div>
    </aside>

    <main class="p-4 lg:p-6 space-y-4">
        <header class="flex items-center justify-between gap-3">
            <h2 class="text-3xl font-bold">{{ $title }}</h2>
            <div class="text-right">
                <p class="text-lg font-semibold">{{ $userInfo['username'] ?? 'Usuario' }}</p>
                <p class="text-xs text-slate-400">En línea</p>
            </div>
        </header>
        @if($errors->has('series'))
            <div class="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {{ $errors->first('series') }}
            </div>
        @endif

        <section>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                @foreach($items as $item)
                    @php
                        $image = $item[$imageField] ?? null;
                        $id = $item[$idField] ?? ($item['stream_id'] ?? $item['id'] ?? null);
                        $link = '#';
                        if ($type === 'series' && $id) {
                            $link = route('portal.play.series', ['seriesId' => $id]);
                        } elseif ($id) {
                            $link = route('portal.play', ['type' => $type, 'id' => $id]);
                            if ($type === 'movie' && !empty($item['container_extension'])) {
                                $link .= '?ext=' . urlencode($item['container_extension']);
                            }
                        }
                    @endphp
                    <a href="{{ $link }}" class="group rounded-xl overflow-hidden border border-white/10 bg-[#0b1224] {{ $id ? '' : 'pointer-events-none opacity-50' }}">
                        <div class="aspect-[2/3] overflow-hidden">
                            @if($image)
                                <img src="{{ $image }}" class="w-full h-full object-cover group-hover:scale-105 transition" alt="">
                            @else
                                <div class="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900"></div>
                            @endif
                        </div>
                    </a>
                @endforeach
            </div>
        </section>
    </main>
</div>
</body>
</html>
