<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $seriesTitle ?? $title }}</title>
    @include('partials.favicon')
    @include('partials.noindex')
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'] },
                    colors: {
                        cyan: { 100: '#ffe0de', 200: '#ffc6c2', 300: '#ffa299', 400: '#ff6363', 500: '#ff6363', 600: '#ee4444' },
                        blue: { 500: '#f05252', 600: '#dc3a3a' },
                        slate: { 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 950: '#08080b' },
                    },
                },
            },
        };
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body class="min-h-screen bg-[#08080b] font-sans text-[#F4F7FB]">
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
        <div class="absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_60%_70%_at_50%_-20%,rgba(255,99,99,0.16),transparent_70%)]"></div>
    </div>

    <div class="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-3 pb-8 md:p-5">
        <header class="rounded-[24px] border border-white/10 bg-[#0d0d11]/85 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <a
                        href="{{ $type === 'series' ? '/app/series' : ($type === 'channel' ? '/app/tv' : '/app/peliculas') }}"
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
                    <h1 class="mt-2 line-clamp-2 text-xl font-black text-white md:text-2xl">{{ $seriesTitle ?? $title }}</h1>
                </div>

                <div class="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Reproduccion</p>
                    <p id="playback-status" class="mt-1 text-sm font-semibold text-emerald-300">Cargando</p>
                </div>
            </div>
        </header>

        <section class="rounded-[28px] border border-white/10 bg-[#0d0d11]/88 p-3 shadow-[0_22px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-4">
            <div class="overflow-hidden rounded-[22px] border border-white/10 bg-black">
                <div class="relative aspect-video bg-black">
                    <video id="video" controls autoplay playsinline class="h-full w-full bg-black object-contain"></video>
                    <div id="player-overlay" class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white transition">
                        Preparando reproduccion...
                    </div>
                </div>
            </div>

            <div id="audio-warning" class="mt-3 hidden rounded-[20px] border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                <p class="font-semibold">Este video suena sin audio en el navegador</p>
                <p class="mt-1 text-xs text-amber-100/80">
                    La pelicula parece usar un formato de audio (como AC3, E-AC3 o DTS) que Chrome y Brave no pueden reproducir.
                    La imagen funciona, pero el sonido solo se escucha en la app de Android, en VLC o en un navegador compatible.
                </p>
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
            <section class="rounded-[28px] border border-white/10 bg-[#0d0d11]/82 p-4 backdrop-blur-xl md:p-5">
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
                            class="rounded-2xl border px-4 py-3 transition {{ (int)$currentEpisodeId === (int)$ep['id'] ? 'border-cyan-300/40 bg-cyan-400/12 text-white shadow-[0_0_25px_rgba(255,99,99,0.14)]' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white' }}"
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

        @php($relatedId = $type === 'series' ? ($seriesId ?? null) : ($id ?? null))
        @if(in_array($type, ['movie', 'series'], true) && !empty($relatedId))
            {{-- Mas peliculas o series de la misma categoria; se llena con /api/player/related. --}}
            <section id="related-section" data-type="{{ $type }}" data-id="{{ $relatedId }}" class="hidden rounded-[28px] border border-white/10 bg-[#0d0d11]/82 p-4 backdrop-blur-xl md:p-5">
                <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                        <p class="text-[11px] uppercase tracking-[0.18em] text-slate-500">Recomendadas</p>
                        <h2 id="related-title" class="mt-1 truncate text-lg font-black text-white md:text-xl">Mas como esta</h2>
                    </div>
                    <div class="hidden shrink-0 gap-2 md:flex">
                        <button id="related-prev" type="button" aria-label="Anterior" class="grid size-10 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-xl text-white transition hover:border-white/35 hover:bg-white/15">&lsaquo;</button>
                        <button id="related-next" type="button" aria-label="Siguiente" class="grid size-10 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-xl text-white transition hover:border-white/35 hover:bg-white/15">&rsaquo;</button>
                    </div>
                </div>
                <div id="related-scroller" class="-mx-1 mt-4 flex snap-x gap-3 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"></div>
            </section>
        @endif
    </div>

    <script>
        const video = document.getElementById('video');
        const playbackStatus = document.getElementById('playback-status');
        const playerOverlay = document.getElementById('player-overlay');
        const retryButton = document.getElementById('retry-button');
        const fullscreenButton = document.getElementById('fullscreen-button');
        let candidates = @json($candidates ?? [$url]);
        // iPhone/iPad (Safari): el panel responde encabezados no estandar en la direccion directa, asi que primero se
        // prueba la que pasa por el servidor y la directa queda de respaldo. Ademas Safari reproduce HLS por si mismo.
        const isApple = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (isApple) {
            candidates = [...candidates.filter((c) => c.startsWith('/')), ...candidates.filter((c) => !c.startsWith('/'))];
        }
        let watchdog = null;
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

            // Si en un rato la fuente no empieza a cargar (Safari a veces no avisa del error), se pasa a la siguiente.
            clearTimeout(watchdog);
            watchdog = setTimeout(() => {
                if (video.readyState < 2) tryPlay(currentIndex + 1);
            }, 15000);

            if (window.Hls && Hls.isSupported() && src.includes('.m3u8') && !(isApple && video.canPlayType('application/vnd.apple.mpegurl'))) {
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

        video.addEventListener('loadeddata', () => clearTimeout(watchdog));

        video.addEventListener('playing', () => {
            clearTimeout(watchdog);
            setStatus('Reproduciendo', 'emerald');
            hideOverlay();
            scheduleAudioCheck();
        });

        // Si el video avanza pero el navegador no decodifica nada de audio, avisamos en pantalla.
        let audioCheckTimer = null;
        function scheduleAudioCheck() {
            clearTimeout(audioCheckTimer);
            audioCheckTimer = setTimeout(() => {
                const warning = document.getElementById('audio-warning');
                if (!warning || video.paused || video.muted || video.volume === 0 || video.currentTime < 2) return;
                const noAudio = (typeof video.webkitAudioDecodedByteCount === 'number' && video.webkitAudioDecodedByteCount === 0)
                    || video.mozHasAudio === false;
                warning.classList.toggle('hidden', !noAudio);
            }, 4000);
        }

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
    <script>
        // Fila de recomendados de la misma categoria, con flechas para recorrerla.
        (function () {
            const section = document.getElementById('related-section');
            if (!section) return;
            const type = section.dataset.type;
            const scroller = document.getElementById('related-scroller');
            const prev = document.getElementById('related-prev');
            const next = document.getElementById('related-next');

            function updateArrows() {
                const atStart = scroller.scrollLeft < 12;
                const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 12;
                prev.classList.toggle('opacity-30', atStart);
                prev.classList.toggle('pointer-events-none', atStart);
                next.classList.toggle('opacity-30', atEnd);
                next.classList.toggle('pointer-events-none', atEnd);
            }

            prev.addEventListener('click', () => scroller.scrollBy({ left: -scroller.clientWidth * 0.8, behavior: 'smooth' }));
            next.addEventListener('click', () => scroller.scrollBy({ left: scroller.clientWidth * 0.8, behavior: 'smooth' }));
            scroller.addEventListener('scroll', updateArrows, { passive: true });
            window.addEventListener('resize', updateArrows);

            fetch('/api/player/related/' + type + '/' + section.dataset.id, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
                .then((response) => (response.ok ? response.json() : Promise.reject()))
                .then((data) => {
                    if (!data.items || !data.items.length) return;
                    document.getElementById('related-title').textContent = data.category ? 'Mas en ' + data.category : 'Mas como esta';

                    data.items.forEach((item) => {
                        const link = document.createElement('a');
                        link.href = type === 'series' ? '/play/series/' + item.id : '/play/movie/' + item.id + '?ext=' + encodeURIComponent(item.ext);
                        link.className = 'group block w-[132px] shrink-0 snap-start md:w-[150px]';

                        const poster = document.createElement('div');
                        poster.className = 'relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/35';
                        if (item.poster) {
                            const img = document.createElement('img');
                            img.src = item.poster;
                            img.alt = item.name;
                            img.loading = 'lazy';
                            img.className = 'absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105';
                            poster.appendChild(img);
                        } else {
                            const fallback = document.createElement('div');
                            fallback.className = 'absolute inset-0 grid place-items-center p-3 text-center text-sm font-bold text-white/80';
                            fallback.textContent = item.name;
                            poster.appendChild(fallback);
                        }

                        const name = document.createElement('p');
                        name.className = 'mt-2 line-clamp-1 text-[13px] font-medium text-zinc-100';
                        name.textContent = item.name;
                        link.append(poster, name);

                        if (item.meta) {
                            const meta = document.createElement('p');
                            meta.className = 'text-[11px] text-zinc-500';
                            meta.textContent = item.meta;
                            link.appendChild(meta);
                        }
                        scroller.appendChild(link);
                    });

                    section.classList.remove('hidden');
                    updateArrows();
                })
                .catch(() => {});
        })();
    </script>
</body>
</html>
