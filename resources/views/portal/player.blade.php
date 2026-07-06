<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body class="min-h-screen bg-[#050914] text-[#F4F7FB]">
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
        <div class="absolute -left-16 top-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div class="absolute right-0 top-12 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl"></div>
        <div class="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500/5 blur-3xl"></div>
    </div>

    <div class="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-3 pb-8 md:p-5">
        <header class="rounded-[24px] border border-white/10 bg-[#0B1220]/85 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <a
                        href="{{ route('portal.dashboard') }}"
                        class="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-300 transition hover:text-cyan-200"
                        onclick="if (window.history.length > 1) { event.preventDefault(); window.history.back(); }"
                    >
                        <span>&larr;</span>
                        Volver
                    </a>
                    <div class="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        <span class="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-100">
                            {{ $type === 'series' ? 'Serie' : 'Pelicula' }}
                        </span>
                        @if(!empty($episodes))
                            <span>{{ count($episodes) }} episodios</span>
                        @endif
                    </div>
                    <h1 class="mt-2 line-clamp-2 text-xl font-black text-white md:text-2xl">{{ $title }}</h1>
                </div>

                <div class="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Reproduccion</p>
                    <p id="playback-status" class="mt-1 text-sm font-semibold text-emerald-300">Cargando</p>
                </div>
            </div>
        </header>

        <section class="rounded-[28px] border border-white/10 bg-[#09111E]/88 p-3 shadow-[0_22px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-4">
            <div class="overflow-hidden rounded-[22px] border border-white/10 bg-black">
                <div class="relative aspect-video bg-black">
                    <video id="video" controls autoplay playsinline class="h-full w-full bg-black object-contain"></video>
                    <div id="player-overlay" class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white transition">
                        Preparando reproduccion...
                    </div>
                </div>
            </div>

            <div class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <div class="min-w-0">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Ahora viendo</p>
                    <p class="line-clamp-1 text-sm font-semibold text-white md:text-base">{{ $title }}</p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <button id="retry-button" type="button" class="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-500/10">
                        Reintentar
                    </button>
                    <button id="fullscreen-button" type="button" class="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:brightness-110">
                        Pantalla completa
                    </button>
                </div>
            </div>
        </section>

        @if(!empty($episodes) && !empty($seriesId))
            <section class="rounded-[28px] border border-white/10 bg-[#0B1220]/82 p-4 backdrop-blur-xl md:p-5">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Lista de episodios</p>
                        <h2 class="mt-1 text-lg font-black text-white md:text-xl">Continuar con la temporada</h2>
                    </div>
                    <span class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                        {{ count($episodes) }} items
                    </span>
                </div>

                <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach($episodes as $ep)
                        <a
                            href="{{ route('portal.play.series', ['seriesId' => $seriesId, 'episodeId' => $ep['id']]) }}"
                            class="rounded-2xl border px-4 py-3 transition {{ (int)$currentEpisodeId === (int)$ep['id'] ? 'border-cyan-300/40 bg-cyan-400/12 text-white shadow-[0_0_25px_rgba(34,211,238,0.12)]' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white' }}"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0">
                                    <p class="text-[10px] uppercase tracking-[0.18em] {{ (int)$currentEpisodeId === (int)$ep['id'] ? 'text-cyan-200' : 'text-slate-500' }}">
                                        Temporada {{ $ep['season'] }}
                                    </p>
                                    <p class="mt-1 line-clamp-2 text-sm font-semibold">{{ $ep['title'] }}</p>
                                </div>
                                @if((int)$currentEpisodeId === (int)$ep['id'])
                                    <span class="rounded-full bg-cyan-400 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-950">
                                        Activo
                                    </span>
                                @endif
                            </div>
                        </a>
                    @endforeach
                </div>
            </section>
        @endif
    </div>

    <script>
        const video = document.getElementById('video');
        const playbackStatus = document.getElementById('playback-status');
        const playerOverlay = document.getElementById('player-overlay');
        const retryButton = document.getElementById('retry-button');
        const fullscreenButton = document.getElementById('fullscreen-button');
        const candidates = @json($candidates ?? [$url]);
        const desktopBridge = window.desktopBridge;
        const desktopMode = Boolean(desktopBridge && typeof desktopBridge.openNativeStream === 'function');
        let currentIndex = 0;
        let hls = null;

        function setStatus(message, tone = 'emerald') {
            if (!playbackStatus) return;
            playbackStatus.textContent = message;
            playbackStatus.className = `mt-1 text-sm font-semibold text-${tone}-300`;
        }

        function showOverlay(message = '') {
            if (!playerOverlay) return;
            playerOverlay.textContent = message;
            playerOverlay.classList.remove('opacity-0');
        }

        function hideOverlay() {
            if (!playerOverlay) return;
            playerOverlay.classList.add('opacity-0');
        }

        function cleanupHls() {
            if (hls) {
                hls.destroy();
                hls = null;
            }
        }

        function tryPlay(index) {
            if (index >= candidates.length) {
                setStatus('No disponible', 'rose');
                showOverlay('No pudimos reproducir este contenido.');
                return;
            }
            currentIndex = index;
            const src = candidates[index];
            setStatus(`Fuente ${index + 1}/${candidates.length}`, 'amber');
            showOverlay('Probando una fuente de video...');

            if (desktopMode) {
                setStatus('Abriendo en escritorio', 'cyan');
                desktopBridge.openNativeStream(src, @json($title));
                return;
            }

            cleanupHls();
            video.removeAttribute('src');
            video.load();

            if (window.Hls && Hls.isSupported() && src.includes('.m3u8')) {
                hls = new Hls();
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    setStatus('Reproduciendo', 'emerald');
                    hideOverlay();
                });
                hls.on(Hls.Events.ERROR, function (_, data) {
                    if (data && data.fatal) {
                        setStatus('Cambiando fuente', 'amber');
                        tryPlay(currentIndex + 1);
                    }
                });
                video.play().catch(() => {});
            } else {
                video.src = src;
                video.play().catch(() => {});
            }
        }

        video.addEventListener('error', () => {
            setStatus('Error de video', 'rose');
            tryPlay(currentIndex + 1);
        });

        video.addEventListener('playing', () => {
            setStatus('Reproduciendo', 'emerald');
            hideOverlay();
        });

        video.addEventListener('waiting', () => {
            setStatus('Cargando...', 'amber');
            showOverlay('Cargando video...');
        });

        retryButton?.addEventListener('click', () => {
            tryPlay(currentIndex);
        });

        fullscreenButton?.addEventListener('click', () => {
            if (document.fullscreenElement) {
                document.exitFullscreen?.();
                return;
            }
            video.requestFullscreen?.();
        });

        tryPlay(0);
    </script>
</body>
</html>
