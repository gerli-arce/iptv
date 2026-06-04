<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TV en vivo - FastnetPlayer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
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

    <main class="p-3 lg:p-4">
        <div class="grid grid-cols-1 xl:grid-cols-[460px_1fr] gap-3 h-[calc(100vh-2rem)]">
            <section class="grid grid-cols-[180px_1fr] gap-2 min-h-0">
                <div class="bg-[#111827]/80 border border-white/10 rounded-xl overflow-auto">
                    <a href="{{ route('portal.live', ['category_id' => 'all']) }}" class="flex justify-between px-3 py-2 text-sm border-b border-white/5 {{ $selectedCategory === 'all' ? 'bg-violet-500/20 text-violet-200' : 'hover:bg-white/5' }}">
                        <span>Todo</span>
                        <span>{{ count($channels) }}</span>
                    </a>
                    @foreach($categories as $cat)
                        <a href="{{ route('portal.live', ['category_id' => $cat['category_id'] ?? '', 'ch' => request('ch')]) }}" class="flex justify-between px-3 py-2 text-sm border-b border-white/5 {{ (string)$selectedCategory === (string)($cat['category_id'] ?? '') ? 'bg-violet-500/20 text-violet-200' : 'hover:bg-white/5' }}">
                            <span>{{ $cat['category_name'] ?? 'Categoría' }}</span>
                            <span class="text-slate-400">•</span>
                        </a>
                    @endforeach
                </div>
                <div class="bg-[#111827]/80 border border-white/10 rounded-xl overflow-auto">
                    @foreach($channels as $index => $channel)
                        <a href="{{ route('portal.live', ['category_id' => $selectedCategory, 'ch' => $channel['stream_id'] ?? 0]) }}" class="flex items-center gap-3 px-3 py-2 border-b border-white/5 {{ ((int)($channel['stream_id'] ?? 0) === (int)($currentChannel['stream_id'] ?? 0)) ? 'bg-blue-500/20' : 'hover:bg-white/5' }}">
                            <span class="text-xs text-slate-400 w-4">{{ $index + 1 }}</span>
                            @if(!empty($channel['stream_icon']))
                                <img src="{{ $channel['stream_icon'] }}" class="w-6 h-6 rounded object-cover" alt="">
                            @else
                                <div class="w-6 h-6 rounded bg-slate-600"></div>
                            @endif
                            <span class="text-sm">{{ $channel['name'] ?? 'Canal' }}</span>
                        </a>
                    @endforeach
                </div>
            </section>

            <section class="bg-black border border-white/10 rounded-xl overflow-hidden min-h-0 flex flex-col">
                <div class="flex-1 min-h-0">
                    <video id="video" controls autoplay playsinline class="w-full h-full object-contain bg-black"></video>
                </div>
                <div class="px-4 py-3 bg-[#0b1224] border-t border-white/10">
                    <h2 class="text-2xl font-semibold">{{ $currentChannel['name'] ?? 'Selecciona un canal' }}</h2>
                    <p class="text-sm text-slate-400">TV en vivo</p>
                </div>
            </section>
        </div>
    </main>
</div>

<script>
    const src = @json($streamUrl);
    const video = document.getElementById('video');
    const desktopBridge = window.desktopBridge;
    const desktopMode = Boolean(desktopBridge && typeof desktopBridge.openNativeStream === 'function');
    if (src) {
        if (desktopMode) {
            desktopBridge.openNativeStream(src, @json($currentChannel['name'] ?? 'TV en vivo'));
        } else if (window.Hls && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
        } else {
            video.src = src;
        }
    }
</script>
</body>
</html>
