{{-- SEO basico para paginas publicas secundarias. Uso: @include('partials.seo-page', ['path' => '/privacy-policy', 'description' => '...']) --}}
@php($seoUrl = rtrim((string) config('app.site_url'), '/') . ($path ?? '/'))
<meta name="robots" content="index, follow">
<link rel="canonical" href="{{ $seoUrl }}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Fastnet Player">
<meta property="og:locale" content="es_PE">
<meta property="og:url" content="{{ $seoUrl }}">
<meta property="og:image" content="{{ rtrim((string) config('app.site_url'), '/') }}/og-image.png">
