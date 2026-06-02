<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body class="bg-[#070B12] text-[#F4F7FB] min-h-screen">
    <div class="max-w-6xl mx-auto p-4 space-y-4">
        <div class="flex items-center justify-between">
            <a href="{{ route('portal.dashboard') }}" class="text-cyan-400 hover:text-cyan-300" onclick="if (window.history.length > 1) { event.preventDefault(); window.history.back(); }">&larr; Volver al panel</a>
            <h1 class="font-semibold">{{ $title }}</h1>
        </div>

        <div class="bg-black rounded-xl overflow-hidden border border-white/10">
            <video id="video" controls autoplay playsinline class="w-full aspect-video"></video>
        </div>

        @if(!empty($episodes) && !empty($seriesId))
            <div class="bg-[#0E1420] border border-white/10 rounded-xl p-4">
                <h2 class="font-semibold mb-3">Episodios</h2>
                <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    @foreach($episodes as $ep)
                        <a
                            href="{{ route('portal.play.series', ['seriesId' => $seriesId, 'episodeId' => $ep['id']]) }}"
                            class="px-3 py-2 rounded-lg text-sm border {{ (int)$currentEpisodeId === (int)$ep['id'] ? 'bg-[#4C6FFF]/20 border-[#4C6FFF]/40 text-white' : 'border-white/10 text-[#9AA3B2] hover:text-white' }}"
                        >
                            T{{ $ep['season'] }} - {{ $ep['title'] }}
                        </a>
                    @endforeach
                </div>
            </div>
        @endif
    </div>

    <script>
        const video = document.getElementById('video');
        const candidates = @json($candidates ?? [$url]);
        let currentIndex = 0;
        let hls = null;

        function cleanupHls() {
            if (hls) {
                hls.destroy();
                hls = null;
            }
        }

        function tryPlay(index) {
            if (index >= candidates.length) {
                return;
            }
            currentIndex = index;
            const src = candidates[index];
            cleanupHls();
            video.removeAttribute('src');
            video.load();

            if (window.Hls && Hls.isSupported() && src.includes('.m3u8')) {
                hls = new Hls();
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(Hls.Events.ERROR, function (_, data) {
                    if (data && data.fatal) {
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
            tryPlay(currentIndex + 1);
        });

        tryPlay(0);
    </script>
</body>
</html>
