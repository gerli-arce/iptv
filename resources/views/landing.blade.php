@php
    // Textos SEO compartidos con la pagina (resources/data/landing-seo.json): una sola fuente de verdad.
    $seo = json_decode(file_get_contents(resource_path('data/landing-seo.json')), true);
    $site = rtrim((string) config('app.site_url'), '/');
    $url = $site . '/';
    $image = $site . '/og-image.png';
    $logo = $site . '/logo-fastnet-player.png';

    $offers = array_map(fn ($plan) => [
        '@type' => 'Offer',
        'name' => 'Plan ' . $plan['name'],
        'description' => $plan['summary'],
        'price' => $plan['price'],
        'priceCurrency' => $plan['currency'],
        'availability' => 'https://schema.org/InStock',
        'url' => $url . '#pricing',
    ], $seo['plans']);

    $jsonLd = [
        '@context' => 'https://schema.org',
        '@graph' => [
            [
                '@type' => 'Organization',
                '@id' => $url . '#organization',
                'name' => $seo['brand'],
                'alternateName' => $seo['alternate_names'],
                'url' => $url,
                'logo' => ['@type' => 'ImageObject', 'url' => $logo, 'width' => 512, 'height' => 512],
                'contactPoint' => [[
                    '@type' => 'ContactPoint',
                    'telephone' => $seo['phone'],
                    'contactType' => 'customer support',
                    'areaServed' => 'PE',
                    'availableLanguage' => 'Spanish',
                ]],
            ],
            [
                '@type' => 'WebSite',
                '@id' => $url . '#website',
                'url' => $url,
                'name' => $seo['brand'],
                'description' => $seo['description'],
                'inLanguage' => 'es-PE',
                'publisher' => ['@id' => $url . '#organization'],
            ],
            [
                '@type' => 'SoftwareApplication',
                '@id' => $url . '#app',
                'name' => $seo['brand'],
                'alternateName' => 'FASTNET TV',
                'description' => 'App de IPTV en Perú: televisión por internet con canales en vivo, películas y series en HD y 4K.',
                'operatingSystem' => 'Android',
                'applicationCategory' => 'MultimediaApplication',
                'image' => $image,
                'url' => $url,
                'downloadUrl' => $seo['play_store_url'],
                'installUrl' => $seo['play_store_url'],
                'inLanguage' => 'es-PE',
                'publisher' => ['@id' => $url . '#organization'],
                'offers' => $offers,
            ],
            [
                '@type' => 'FAQPage',
                '@id' => $url . '#faq',
                'inLanguage' => 'es-PE',
                'mainEntity' => array_map(fn ($item) => [
                    '@type' => 'Question',
                    'name' => $item['q'],
                    'acceptedAnswer' => ['@type' => 'Answer', 'text' => $item['a']],
                ], $seo['faq']),
            ],
        ],
    ];
@endphp
<!doctype html>
<html lang="es-PE">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $seo['title'] }}</title>
    <meta name="description" content="{{ $seo['description'] }}">
    <meta name="keywords" content="{{ $seo['keywords'] }}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="author" content="{{ $seo['brand'] }}">
    <meta name="application-name" content="{{ $seo['brand'] }}">
    <meta name="apple-mobile-web-app-title" content="{{ $seo['brand'] }}">
    <link rel="canonical" href="{{ $url }}">
    <link rel="alternate" hreflang="es-PE" href="{{ $url }}">
    <link rel="alternate" hreflang="x-default" href="{{ $url }}">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ $seo['brand'] }}">
    <meta property="og:locale" content="es_PE">
    <meta property="og:title" content="{{ $seo['title'] }}">
    <meta property="og:description" content="{{ $seo['description'] }}">
    <meta property="og:url" content="{{ $url }}">
    <meta property="og:image" content="{{ $image }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Fastnet Player: IPTV en Perú, televisión por internet con canales HD, películas y series">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $seo['title'] }}">
    <meta name="twitter:description" content="{{ $seo['description'] }}">
    <meta name="twitter:image" content="{{ $image }}">

    @include('partials.favicon')

    {{-- Con JavaScript se oculta el contenido de respaldo (para que no parpadee) y se muestra el logo mientras carga.
         Sin JavaScript (buscadores simples) el respaldo queda visible. --}}
    <script>document.documentElement.classList.add('js')</script>
    <style>
        html, body { background: #08080b; }
        #boot-splash { display: none; position: fixed; inset: 0; z-index: 50; place-items: center; background: #08080b; }
        #boot-splash img { width: 64px; height: 64px; border-radius: 16px; animation: bootPulse 1.2s ease-in-out infinite; }
        .js #boot-splash { display: grid; }
        .js #seo-fallback { display: none; }
        @keyframes bootPulse { 0%, 100% { opacity: .55; transform: scale(.94); } 50% { opacity: 1; transform: scale(1); } }
    </style>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

    <script type="application/ld+json">{!! json_encode($jsonLd, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) !!}</script>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/landing.jsx'])
</head>
<body>
    {{-- Contenido de respaldo en HTML puro para buscadores y bots que no ejecutan JavaScript.
         React lo reemplaza apenas carga, con el mismo contenido. --}}
    <div id="app">
        <div id="boot-splash" aria-hidden="true">
            <img src="/logo-fastnet-player.png" alt="" width="64" height="64">
        </div>
        <div id="seo-fallback" class="mx-auto max-w-3xl px-4 py-16 text-zinc-200">
            <a href="{{ $url }}" class="flex items-center gap-3">
                <img src="/logo-fastnet-player.png" alt="Fastnet Player, IPTV en Perú" width="48" height="48" class="rounded-xl">
                <strong class="text-lg text-white">{{ $seo['brand'] }}</strong>
            </a>

            <h1 class="mt-8 text-4xl font-extrabold text-white">Fastnet Player: IPTV en Perú, televisión por internet con canales, cine y series</h1>
            <p class="mt-4 text-lg">{{ $seo['description'] }}</p>

            <h2 class="mt-10 text-2xl font-bold text-white">{{ $seo['about']['title'] }}</h2>
            @foreach ($seo['about']['paragraphs'] as $paragraph)
                <p class="mt-3">{{ $paragraph }}</p>
            @endforeach
            <ul class="mt-3 list-disc space-y-1 pl-5">
                @foreach ($seo['about']['points'] as $point)
                    <li>{{ $point }}</li>
                @endforeach
            </ul>

            <h2 class="mt-10 text-2xl font-bold text-white">Planes de IPTV</h2>
            <ul class="mt-3 space-y-2">
                @foreach ($seo['plans'] as $plan)
                    <li><strong class="text-white">Plan {{ $plan['name'] }}: S/ {{ $plan['price'] }} al mes.</strong> {{ $plan['summary'] }}</li>
                @endforeach
            </ul>

            <h2 class="mt-10 text-2xl font-bold text-white">Descarga la app</h2>
            <p class="mt-3">
                <a class="underline" href="{{ $seo['play_store_url'] }}" rel="noopener">Descarga Fastnet Player desde Play Store</a>
                · <a class="underline" href="/login">Iniciar sesión</a>
            </p>

            <h2 class="mt-10 text-2xl font-bold text-white">Preguntas frecuentes sobre IPTV</h2>
            @foreach ($seo['faq'] as $item)
                <h3 class="mt-5 text-lg font-semibold text-white">{{ $item['q'] }}</h3>
                <p class="mt-1">{{ $item['a'] }}</p>
            @endforeach

            <p class="mt-10 text-sm text-zinc-400">
                <a class="underline" href="/privacy-policy">Política de privacidad</a> ·
                <a class="underline" href="/tv-privacy-policy">Política de privacidad TV</a> ·
                <a class="underline" href="/data-deletion">Eliminación de datos</a>
            </p>
        </div>
    </div>
</body>
</html>
