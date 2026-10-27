<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\MovieCompatService;
use App\Services\TmdbService;
use App\Services\XtreamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;
use Illuminate\View\View;

class PortalController extends Controller
{
    public function __construct(
        private readonly XtreamService $xtreamService,
        private readonly TmdbService $tmdbService,
        private readonly MovieCompatService $movieCompat
    )
    {
    }

    public function landing(): View
    {
        return view('landing');
    }

    public function showLogin(): View|RedirectResponse
    {
        if ($this->hasIptvSession()) {
            return redirect()->route('app');
        }

        return view('spa');
    }

    public function showApp(): View|RedirectResponse
    {
        if (! $this->hasIptvSession()) {
            return redirect()->route('login');
        }

        return view('spa');
    }

    public function login(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'server_url' => ['required', 'url'],
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $auth = $this->xtreamService->login($data['server_url'], $data['username'], $data['password']);

        if (empty($auth['user_info'])) {
            return back()->withInput()->withErrors([
                'credentials' => 'Credenciales invalidas o servidor no disponible.',
            ]);
        }

        session([
            'iptv.server_url' => $data['server_url'],
            'iptv.username' => $data['username'],
            'iptv.password' => $data['password'],
            'iptv.user_info' => $auth['user_info'],
        ]);

        return redirect()->route('app');
    }

    public function dashboard(Request $request): View|RedirectResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();

        if (! $serverUrl || ! $username || ! $password) {
            return redirect()->route('login');
        }

        $channels = $this->xtreamService->getLiveStreams($serverUrl, $username, $password);
        $movies = $this->xtreamService->getVodStreams($serverUrl, $username, $password);
        $series = $this->xtreamService->getSeries($serverUrl, $username, $password);

        $heroTmdb = null;
        $heroMovie = $movies[0] ?? null;
        if (!empty($heroMovie['name'])) {
            try {
                $search = $this->tmdbService->searchMulti($heroMovie['name']);
                if (($search['ok'] ?? false) && !empty($search['data']['results'])) {
                    $firstMovie = collect($search['data']['results'])
                        ->filter(fn ($item) => ($item['media_type'] ?? null) === 'movie')
                        ->sortByDesc(function ($item) {
                            $hasBackdrop = !empty($item['backdrop_path']) ? 1 : 0;
                            return ($hasBackdrop * 1000000) + (int) ($item['popularity'] ?? 0);
                        })
                        ->first();
                    if (!empty($firstMovie['id'])) {
                        $details = $this->tmdbService->movieDetails((int) $firstMovie['id']);
                        $heroTmdb = ($details['ok'] ?? false) ? ($details['data'] ?? $firstMovie) : $firstMovie;
                        $images = $this->tmdbService->movieImages((int) $firstMovie['id']);
                        if (($images['ok'] ?? false) && !empty($images['data']['backdrops'])) {
                            $bestBackdrop = collect($images['data']['backdrops'])
                                ->sortByDesc(fn ($img) => (int) ($img['width'] ?? 0))
                                ->first();
                            if (!empty($bestBackdrop['file_path'])) {
                                $heroTmdb['backdrop_path'] = $bestBackdrop['file_path'];
                            }
                        }
                    } else {
                        $heroTmdb = $firstMovie ?: null;
                    }
                }
            } catch (Throwable $e) {
                $heroTmdb = null;
            }
        }

        return view('portal.dashboard', [
            'userInfo' => session('iptv.user_info', []),
            'channels' => array_slice($channels, 0, 60),
            'movies' => array_slice($movies, 0, 60),
            'series' => array_slice($series, 0, 60),
            'heroTmdb' => $heroTmdb,
            'activePage' => 'home',
        ]);
    }

    public function live(): View|RedirectResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return redirect()->route('login');
        }

        $categories = $this->xtreamService->getLiveCategories($serverUrl, $username, $password);
        $channels = $this->xtreamService->getLiveStreams($serverUrl, $username, $password);
        $selectedCategory = request()->query('category_id', 'all');

        if ($selectedCategory !== 'all') {
            $channels = array_values(array_filter($channels, function ($channel) use ($selectedCategory) {
                return (string) ($channel['category_id'] ?? '') === (string) $selectedCategory;
            }));
        }

        $selectedChannelId = (int) request()->query('ch', (int) ($channels[0]['stream_id'] ?? 0));
        $currentChannel = collect($channels)->firstWhere('stream_id', $selectedChannelId) ?? ($channels[0] ?? null);
        $streamUrl = null;
        if (!empty($currentChannel['stream_id'])) {
            $streamUrl = rtrim($serverUrl, '/') . "/live/{$username}/{$password}/{$currentChannel['stream_id']}.m3u8";
        }

        return view('portal.live', [
            'categories' => $categories,
            'channels' => array_slice($channels, 0, 300),
            'currentChannel' => $currentChannel,
            'streamUrl' => $streamUrl,
            'selectedCategory' => $selectedCategory,
            'activePage' => 'live',
            'userInfo' => session('iptv.user_info', []),
        ]);
    }

    public function movies(): View|RedirectResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return redirect()->route('login');
        }

        $movies = $this->xtreamService->getVodStreams($serverUrl, $username, $password);

        return view('portal.catalog', [
            'title' => 'Películas',
            'items' => array_slice($movies, 0, 200),
            'type' => 'movie',
            'imageField' => 'stream_icon',
            'idField' => 'stream_id',
            'activePage' => 'movies',
            'userInfo' => session('iptv.user_info', []),
        ]);
    }

    public function series(): View|RedirectResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return redirect()->route('login');
        }

        $series = $this->xtreamService->getSeries($serverUrl, $username, $password);

        return view('portal.catalog', [
            'title' => 'Series',
            'items' => array_slice($series, 0, 200),
            'type' => 'series',
            'imageField' => 'cover',
            'idField' => 'series_id',
            'activePage' => 'series',
            'userInfo' => session('iptv.user_info', []),
        ]);
    }

    public function logout(): RedirectResponse
    {
        session()->forget('iptv');
        return redirect()->route('login');
    }

    public function play(string $type, int $id): View|RedirectResponse
    {
        $serverUrl = session('iptv.server_url');
        $username = session('iptv.username');
        $password = session('iptv.password');

        if (! $serverUrl || ! $username || ! $password) {
            return redirect()->route('login');
        }

        $url = null;
        $candidates = [];
        $title = 'Reproductor';

        if ($type === 'channel') {
            $candidates = [
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/live/{$username}/{$password}/{$id}.m3u8"),
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/live/{$username}/{$password}/{$id}.ts"),
            ];
            $url = $candidates[0];
            $title = "Canal {$id}";
        }

        if ($type === 'movie') {
            $ext = request()->query('ext', 'mp4');
            $direct = $this->directStreamUrl($serverUrl, "/movie/{$username}/{$password}/{$id}.{$ext}");
            $candidates = array_values(array_unique(array_filter([
                // Primero la direccion directa del panel (el video no pasa por este servidor); el resto es respaldo.
                $direct,
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/movie/{$username}/{$password}/{$id}.{$ext}"),
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/movie/{$username}/{$password}/{$id}.mp4"),
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/movie/{$username}/{$password}/{$id}.mkv"),
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/movie/{$username}/{$password}/{$id}.m3u8"),
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/movie/{$username}/{$password}/{$id}.ts"),
            ])));
            $url = $candidates[0];
            $title = "Pelicula {$id}";
        }

        if (! $url) {
            return redirect()->route('app');
        }

        return view('portal.player', compact('url', 'title', 'type', 'candidates', 'id'));
    }

    public function playSeries(int $seriesId, ?int $episodeId = null): View|RedirectResponse
    {
        $serverUrl = session('iptv.server_url');
        $username = session('iptv.username');
        $password = session('iptv.password');

        if (! $serverUrl || ! $username || ! $password) {
            return redirect()->route('login');
        }

        $seriesInfo = $this->xtreamService->getSeriesInfo($serverUrl, $username, $password, $seriesId);
        $episodesBySeason = is_array($seriesInfo['episodes'] ?? null) ? $seriesInfo['episodes'] : [];
        $flatEpisodes = [];

        foreach ($episodesBySeason as $season => $episodes) {
            if (!is_array($episodes)) {
                continue;
            }
            foreach ($episodes as $ep) {
                if (!is_array($ep)) {
                    continue;
                }
                $resolvedId = $ep['id'] ?? $ep['stream_id'] ?? $ep['episode_id'] ?? null;
                $resolvedTitle = $ep['title'] ?? $ep['name'] ?? ('Episodio ' . ($ep['episode_num'] ?? ''));
                $resolvedExt = $ep['container_extension'] ?? $ep['containerExtension'] ?? 'mp4';
                if (empty($resolvedId)) {
                    continue;
                }
                $flatEpisodes[] = [
                    'season' => $season,
                    'id' => $resolvedId,
                    'title' => $resolvedTitle,
                    'ext' => $resolvedExt,
                ];
            }
        }

        // Oculta los episodios que el navegador no reproduce bien (audio AC3/DTS, etc.).
        $flatEpisodes = $this->movieCompat->playableEpisodes($flatEpisodes);

        usort($flatEpisodes, function ($a, $b) {
            $sa = (int) preg_replace('/\D+/', '', (string) $a['season']);
            $sb = (int) preg_replace('/\D+/', '', (string) $b['season']);
            if ($sa === $sb) {
                return (int) $a['id'] <=> (int) $b['id'];
            }
            return $sa <=> $sb;
        });

        $selected = null;
        if ($episodeId) {
            $selected = collect($flatEpisodes)->firstWhere('id', $episodeId);
        }
        if (! $selected) {
            $selected = Arr::first($flatEpisodes);
        }

        if (! $selected || empty($selected['id'])) {
            return redirect()->route('app')->withErrors([
                'series' => 'No se encontraron episodios para esta serie.',
            ]);
        }

        $selectedExt = $selected['ext'] ?: 'mp4';
        $direct = $this->directStreamUrl($serverUrl, "/series/{$username}/{$password}/{$selected['id']}.{$selectedExt}");
        $candidates = array_values(array_unique(array_filter([
            $direct,
            $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/series/{$username}/{$password}/{$selected['id']}.{$selectedExt}"),
            $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/series/{$username}/{$password}/{$selected['id']}.mp4"),
            $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/series/{$username}/{$password}/{$selected['id']}.mkv"),
            $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/series/{$username}/{$password}/{$selected['id']}.m3u8"),
            $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/series/{$username}/{$password}/{$selected['id']}.ts"),
        ])));
        $url = $candidates[0];
        $title = $selected['title'];

        return view('portal.player', [
            'url' => $url,
            'title' => $title,
            'type' => 'series',
            'candidates' => $candidates,
            'episodes' => $flatEpisodes,
            'seriesId' => $seriesId,
            'currentEpisodeId' => (int) $selected['id'],
        ]);
    }

    private function getIptvSessionCredentials(): array
    {
        return [
            session('iptv.server_url'),
            session('iptv.username'),
            session('iptv.password'),
        ];
    }

    private function hasIptvSession(): bool
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();

        return filled($serverUrl) && filled($username) && filled($password);
    }

    public function apiMe(): JsonResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return response()->json(['authenticated' => false], 401);
        }
        return response()->json([
            'authenticated' => true,
            'user' => session('iptv.user_info', []),
            'server_url' => $serverUrl,
        ]);
    }

    public function apiLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'server_url' => ['required', 'url'],
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $auth = $this->xtreamService->login($data['server_url'], $data['username'], $data['password']);
        if (empty($auth['user_info'])) {
            return response()->json(['message' => 'Credenciales invalidas'], 422);
        }

        session([
            'iptv.server_url' => $data['server_url'],
            'iptv.username' => $data['username'],
            'iptv.password' => $data['password'],
            'iptv.user_info' => $auth['user_info'],
        ]);

        return response()->json(['ok' => true, 'user' => $auth['user_info'] ?? []]);
    }

    public function apiLogout(): JsonResponse
    {
        session()->forget('iptv');
        return response()->json(['ok' => true]);
    }

    public function apiHome(): JsonResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return response()->json(['message' => 'No autenticado'], 401);
        }
        $channels = $this->xtreamService->getLiveStreams($serverUrl, $username, $password);
        $movies = $this->xtreamService->getVodStreams($serverUrl, $username, $password);
        $series = $this->xtreamService->getSeries($serverUrl, $username, $password);
        $heroTmdb = null;
        $heroMovie = $movies[0] ?? null;

        if (!empty($heroMovie['name'])) {
            try {
                $query = preg_replace('/\b(HD|FHD|4K|LATINO|SUBTITULADO|ESPANOL)\b/i', '', (string) $heroMovie['name']);
                $query = trim(preg_replace('/[._-]+/', ' ', $query));
                $search = $this->tmdbService->searchMulti($query ?: $heroMovie['name']);
                $results = $search['data']['results'] ?? [];
                $firstMovie = collect($results)->firstWhere('media_type', 'movie') ?: ($results[0] ?? null);
                if (!empty($firstMovie['id'])) {
                    $details = $this->tmdbService->movieDetails((int) $firstMovie['id']);
                    $heroTmdb = ($details['ok'] ?? false) ? ($details['data'] ?? $firstMovie) : $firstMovie;
                }
            } catch (Throwable $e) {
                $heroTmdb = null;
            }
        }

        return response()->json([
            'channels' => array_slice($channels, 0, 60),
            'movies' => array_slice($movies, 0, 60),
            'series' => array_slice($series, 0, 60),
            'heroTmdb' => $heroTmdb,
        ]);
    }

    /**
     * Los banners y secciones del inicio (los publica el panel), con la imagen horizontal de fondo de TMDB ya
     * resuelta en cada destacado. Asi el navegador muestra el fondo completo desde el primer momento, sin una
     * segunda consulta a TMDB.
     */
    public function apiHomeFeed(): JsonResponse
    {
        $url = (string) config('app.home_api_url');
        if ($url === '') {
            return response()->json(['message' => 'Inicio no configurado'], 503);
        }

        try {
            $data = Cache::remember('home.feed', now()->addSeconds(60), function () use ($url): array {
                $response = Http::timeout(6)->acceptJson()->get($url);
                if (! $response->successful() || ! is_array($response->json())) {
                    throw new \RuntimeException('respuesta invalida del inicio');
                }

                return $response->json();
            });
        } catch (Throwable) {
            return response()->json(['message' => 'No se pudo cargar el inicio'], 502);
        }

        return response()->json($this->withBackdrops($data));
    }

    /**
     * Agrega backdrop_url a los primeros elementos de las secciones que tienen poster de TMDB (los que usa el banner).
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function withBackdrops(array $data): array
    {
        $deadline = microtime(true) + 3.0;
        $count = 0;

        foreach (($data['sections'] ?? []) as $s => $section) {
            foreach (($section['items'] ?? []) as $i => $item) {
                if ($count >= 8) {
                    break 2;
                }
                if (! str_contains((string) ($item['custom_image'] ?? ''), 'image.tmdb.org')) {
                    continue;
                }
                $count++;
                $title = (string) ($item['custom_title'] ?? $item['title'] ?? $item['name'] ?? $item['external_id'] ?? '');
                $kind = strtolower((string) ($item['content_type'] ?? '')) === 'series' ? 'tv' : 'movie';
                $backdrop = $this->tmdbBackdrop($title, $kind, $deadline);
                if ($backdrop) {
                    $data['sections'][$s]['items'][$i]['backdrop_url'] = $backdrop;
                }
            }
        }

        return $data;
    }

    /**
     * Imagen horizontal de TMDB para un titulo. Se guarda 7 dias (los titulos sin imagen, 6 horas; los errores no
     * se guardan). Si se acaba el tiempo disponible devuelve null y la web la busca por su cuenta.
     */
    private function tmdbBackdrop(string $title, string $kind, float $deadline): ?string
    {
        $query = trim((string) preg_replace('/\s+/', ' ', (string) preg_replace('/[._-]/', ' ', (string) preg_replace('/\b(HD|FHD|4K|LATINO|SUBTITULADO|ESPANOL)\b/i', '', $title))));
        if (mb_strlen($query) < 2) {
            return null;
        }

        $key = 'tmdb.backdrop.' . $kind . '.' . md5(mb_strtolower($query));
        $cached = Cache::get($key);
        if ($cached !== null) {
            return $cached === '' ? null : $cached;
        }
        if (microtime(true) > $deadline) {
            return null;
        }

        $result = $this->tmdbService->searchMulti($query);
        if (! ($result['ok'] ?? false)) {
            return null;
        }

        $results = collect($result['data']['results'] ?? []);
        $hit = $results->first(fn ($r) => ($r['media_type'] ?? null) === $kind && ! empty($r['backdrop_path']))
            ?: $results->first(fn ($r) => ! empty($r['backdrop_path']));
        $url = $hit ? 'https://image.tmdb.org/t/p/original' . $hit['backdrop_path'] : null;

        Cache::put($key, $url ?? '', $url ? now()->addDays(7) : now()->addHours(6));

        return $url;
    }

    /**
     * Ficha de una pelicula o serie para la ventana de detalle: los datos del panel (siempre) mejorados con TMDB
     * (reparto con fotos, trailer, fondo grande). El panel entrega el id exacto de TMDB de cada pelicula.
     */
    public function apiTitleInfo(string $type, int $id): JsonResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $payload = $type === 'series'
            ? $this->seriesInfoPayload($serverUrl, $username, $password, $id)
            : $this->movieInfoPayload($serverUrl, $username, $password, $id);

        return $payload
            ? response()->json($payload)
            : response()->json(['message' => 'No se encontro la informacion'], 404);
    }

    /**
     * Datos de TMDB de una temporada (titulo, sinopsis e imagen de cada capitulo), por numero de capitulo.
     */
    public function apiSeriesSeason(Request $request, int $id, int $season): JsonResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $tmdbId = (int) $request->query('tmdb', 0);
        $episodes = [];
        if ($tmdbId > 0) {
            $result = $this->tmdbService->tvSeason($tmdbId, $season);
            foreach ((($result['ok'] ?? false) ? ($result['data']['episodes'] ?? []) : []) as $episode) {
                $rating = round((float) ($episode['vote_average'] ?? 0), 1);
                $episodes[(int) ($episode['episode_number'] ?? 0)] = [
                    'title' => (string) ($episode['name'] ?? ''),
                    'overview' => (string) ($episode['overview'] ?? ''),
                    'still' => ! empty($episode['still_path']) ? 'https://image.tmdb.org/t/p/w300' . $episode['still_path'] : null,
                    'runtime' => $episode['runtime'] ?? null,
                    'air_date' => $episode['air_date'] ?? null,
                    'rating' => $rating > 0 ? $rating : null,
                ];
            }
        }

        return response()->json(['episodes' => (object) $episodes]);
    }

    private function movieInfoPayload(string $serverUrl, string $username, string $password, int $id): ?array
    {
        $vod = $this->xtreamService->getVodInfo($serverUrl, $username, $password, $id);
        $info = is_array($vod['info'] ?? null) ? $vod['info'] : [];
        $data = is_array($vod['movie_data'] ?? null) ? $vod['movie_data'] : [];
        $name = trim((string) ($info['name'] ?? $data['name'] ?? ''));
        if ($name === '' && ! $info) {
            return null;
        }

        $tmdb = $this->tmdbTitle('movie', (int) ($info['tmdb_id'] ?? 0), $name, $this->yearOf($info['releasedate'] ?? $info['release_date'] ?? null));
        $ext = (string) ($data['container_extension'] ?? $info['container_extension'] ?? '') ?: 'mp4';

        return array_merge($this->titlePayload('movie', $id, $name, $info, $tmdb), [
            'play_url' => "/play/movie/{$id}?ext={$ext}",
        ]);
    }

    private function seriesInfoPayload(string $serverUrl, string $username, string $password, int $id): ?array
    {
        $series = $this->xtreamService->getSeriesInfo($serverUrl, $username, $password, $id);
        $info = is_array($series['info'] ?? null) ? $series['info'] : [];
        $episodesBySeason = is_array($series['episodes'] ?? null) ? $series['episodes'] : [];
        $name = trim((string) ($info['name'] ?? ''));
        if ($name === '' && ! $episodesBySeason) {
            return null;
        }

        $tmdb = $this->tmdbTitle('tv', (int) ($info['tmdb_id'] ?? $info['tmdb'] ?? 0), $name, $this->yearOf($info['releaseDate'] ?? $info['release_date'] ?? null));
        $payload = $this->titlePayload('series', $id, $name, $info, $tmdb);

        $flat = [];
        foreach ($episodesBySeason as $season => $episodes) {
            if (! is_array($episodes)) {
                continue;
            }
            foreach ($episodes as $episode) {
                if (! is_array($episode) || empty($episode['id'])) {
                    continue;
                }
                $episodeInfo = is_array($episode['info'] ?? null) ? $episode['info'] : [];
                $flat[] = [
                    'season' => (int) $season,
                    'id' => (string) $episode['id'],
                    'number' => (int) ($episode['episode_num'] ?? 0),
                    'title' => trim((string) ($episode['title'] ?? '')),
                    'overview' => trim((string) ($episodeInfo['plot'] ?? '')),
                    'still' => ($episodeInfo['movie_image'] ?? null) ?: null,
                    'runtime' => isset($episodeInfo['duration_secs']) ? (int) round(((int) $episodeInfo['duration_secs']) / 60) : null,
                    'ext' => ($episode['container_extension'] ?? '') ?: 'mp4',
                ];
            }
        }

        // Los episodios que el navegador no reproduce se ocultan, igual que en la pagina de reproduccion.
        $bySeason = [];
        foreach ($this->movieCompat->playableEpisodes($flat) as $episode) {
            $bySeason[$episode['season']][] = $episode;
        }
        ksort($bySeason);

        $payload['seasons'] = [];
        foreach ($bySeason as $number => $episodes) {
            usort($episodes, fn ($a, $b) => $a['number'] <=> $b['number']);
            $payload['seasons'][] = [
                'number' => $number,
                'name' => $number === 0 ? 'Especiales' : "Temporada {$number}",
                'episodes' => array_map(fn ($episode) => Arr::except($episode, ['season']), $episodes),
            ];
        }
        $payload['tmdb_id'] = $tmdb['id'] ?? null;
        $payload['play_url'] = "/play/series/{$id}";

        return $payload;
    }

    /**
     * Ficha comun de pelicula o serie. TMDB manda cuando hay dato; el panel completa lo que falte.
     *
     * @param array<string, mixed> $info datos del panel
     * @param array<string, mixed>|null $tmdb detalle de TMDB (con credits y videos)
     * @return array<string, mixed>
     */
    private function titlePayload(string $kind, int $id, string $name, array $info, ?array $tmdb): array
    {
        $isMovie = $kind === 'movie';
        $image = fn (?string $path, string $size) => $path ? "https://image.tmdb.org/t/p/{$size}{$path}" : null;

        $genres = $tmdb
            ? array_values(array_filter(array_column($tmdb['genres'] ?? [], 'name')))
            : array_values(array_filter(array_map('trim', explode('/', (string) ($info['genre'] ?? '')))));

        $cast = [];
        foreach (array_slice($tmdb['credits']['cast'] ?? [], 0, 14) as $person) {
            $cast[] = [
                'name' => (string) ($person['name'] ?? ''),
                'character' => (string) ($person['character'] ?? ''),
                'photo' => $image($person['profile_path'] ?? null, 'w185'),
            ];
        }
        if (! $cast) {
            foreach (array_slice(array_values(array_filter(array_map('trim', explode(',', (string) ($info['cast'] ?? ''))))), 0, 14) as $person) {
                $cast[] = ['name' => $person, 'character' => '', 'photo' => null];
            }
        }

        $directors = [];
        foreach (($tmdb['credits']['crew'] ?? []) as $member) {
            if (($member['job'] ?? '') === 'Director') {
                $directors[] = (string) ($member['name'] ?? '');
            }
        }
        foreach (($tmdb['created_by'] ?? []) as $creator) {
            $directors[] = (string) ($creator['name'] ?? '');
        }
        if (! $directors && trim((string) ($info['director'] ?? '')) !== '') {
            $directors = array_map('trim', explode(',', (string) $info['director']));
        }

        $trailer = null;
        foreach (['es', 'en', null] as $language) {
            foreach (($tmdb['videos']['results'] ?? []) as $video) {
                if (($video['site'] ?? '') !== 'YouTube' || ! in_array($video['type'] ?? '', ['Trailer', 'Teaser'], true)) {
                    continue;
                }
                if ($language !== null && ($video['iso_639_1'] ?? '') !== $language) {
                    continue;
                }
                $trailer = (string) ($video['key'] ?? '') ?: null;
                if ($trailer) {
                    break 2;
                }
            }
        }
        $trailer ??= (trim((string) ($info['youtube_trailer'] ?? '')) ?: null);

        $runtime = $isMovie
            ? ((int) ($tmdb['runtime'] ?? 0) ?: (int) round(((int) ($info['duration_secs'] ?? 0)) / 60))
            : ((int) ($tmdb['episode_run_time'][0] ?? 0) ?: (int) ($info['episode_run_time'] ?? 0));
        $rating = round((float) ($tmdb['vote_average'] ?? 0), 1) ?: round((float) ($info['rating'] ?? 0), 1);
        $backdropPanel = is_array($info['backdrop_path'] ?? null) ? ($info['backdrop_path'][0] ?? null) : ($info['backdrop_path'] ?? $info['backdrop'] ?? null);
        $title = trim((string) ($tmdb[$isMovie ? 'title' : 'name'] ?? '')) ?: $name;
        $originalTitle = trim((string) ($tmdb[$isMovie ? 'original_title' : 'original_name'] ?? ''));

        return [
            'type' => $kind,
            'id' => $id,
            'title' => $title,
            'original_title' => $originalTitle !== '' && $originalTitle !== $title ? $originalTitle : null,
            'tagline' => trim((string) ($tmdb['tagline'] ?? '')) ?: null,
            'overview' => trim((string) ($tmdb['overview'] ?? '')) ?: trim((string) ($info['plot'] ?? $info['description'] ?? '')),
            'year' => $this->yearOf($tmdb[$isMovie ? 'release_date' : 'first_air_date'] ?? null) ?? $this->yearOf($info['releasedate'] ?? $info['releaseDate'] ?? $info['release_date'] ?? null),
            'runtime' => $runtime ?: null,
            'rating' => $rating ?: null,
            'genres' => $genres,
            'poster' => $image($tmdb['poster_path'] ?? null, 'w500') ?? ($info['movie_image'] ?? $info['cover'] ?? null),
            'backdrop' => $image($tmdb['backdrop_path'] ?? null, 'w1280') ?? $backdropPanel,
            'cast' => $cast,
            'directors' => array_values(array_unique(array_filter($directors))),
            'trailer' => $trailer,
            'seasons_count' => $isMovie ? null : ($tmdb['number_of_seasons'] ?? null),
            'source' => $tmdb ? 'tmdb' : 'panel',
        ];
    }

    /**
     * Detalle de TMDB de un titulo: por el id que da el panel y, si no hay, buscando por nombre (y año si se conoce).
     *
     * @return array<string, mixed>|null
     */
    private function tmdbTitle(string $kind, int $tmdbId, string $name, ?int $year): ?array
    {
        try {
            if (! $tmdbId && $name !== '') {
                $query = trim((string) preg_replace('/\s+/', ' ', (string) preg_replace('/[._-]/', ' ', (string) preg_replace(['/\(\s*\d{4}\s*\)/', '/\b(HD|FHD|4K|LATINO|SUBTITULADO|ESPANOL)\b/i'], ' ', $name))));
                if (mb_strlen($query) >= 2) {
                    $search = fn (?int $y) => $kind === 'movie' ? $this->tmdbService->searchMovie($query, $y) : $this->tmdbService->searchTv($query, $y);
                    $found = $search($year);
                    $results = ($found['ok'] ?? false) ? ($found['data']['results'] ?? []) : [];
                    if (! $results && $year) {
                        $found = $search(null);
                        $results = ($found['ok'] ?? false) ? ($found['data']['results'] ?? []) : [];
                    }
                    $tmdbId = (int) ($results[0]['id'] ?? 0);
                }
            }
            if (! $tmdbId) {
                return null;
            }

            $details = $kind === 'movie' ? $this->tmdbService->movieDetails($tmdbId) : $this->tmdbService->seriesDetails($tmdbId);

            return ($details['ok'] ?? false) ? $details['data'] : null;
        } catch (Throwable) {
            return null;
        }
    }

    private function yearOf(mixed $value): ?int
    {
        if (preg_match('/(19|20)\d{2}/', (string) $value, $match)) {
            return (int) $match[0];
        }

        return null;
    }

    /**
     * Mas peliculas (o series) de la misma categoria que la que se esta viendo, para la fila de recomendados del
     * reproductor. Deja fuera lo que el navegador no reproduce.
     */
    public function apiRelated(string $type, int $id): JsonResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $isSeries = $type === 'series';
        $key = $isSeries ? 'series_id' : 'stream_id';
        $who = md5($serverUrl . '|' . $username);

        $items = Cache::remember("catalog.{$type}.{$who}", now()->addMinutes(2), fn () => $isSeries
            ? $this->xtreamService->getSeries($serverUrl, $username, $password)
            : $this->xtreamService->getVodStreams($serverUrl, $username, $password));

        $current = collect($items)->first(fn ($item) => (int) ($item[$key] ?? 0) === $id);
        if (! $current) {
            return response()->json(['category' => null, 'items' => []]);
        }

        $categoryId = (string) ($current['category_id'] ?? '');
        $categories = Cache::remember("catalog.{$type}.categories.{$who}", now()->addMinutes(10), fn () => $isSeries
            ? $this->xtreamService->getSeriesCategories($serverUrl, $username, $password)
            : $this->xtreamService->getVodCategories($serverUrl, $username, $password));
        $categoryName = collect($categories)->first(fn ($category) => (string) ($category['category_id'] ?? '') === $categoryId)['category_name'] ?? null;

        $blocked = $isSeries ? $this->movieCompat->unplayableSeries() : $this->movieCompat->unplayable();

        $related = collect($items)
            ->filter(fn ($item) => (string) ($item['category_id'] ?? '') === $categoryId
                && (int) ($item[$key] ?? 0) !== $id
                && ! isset($blocked[(string) ($item[$key] ?? '')]))
            ->take(60)
            ->map(function ($item) use ($key) {
                $year = substr((string) ($item['year'] ?? $item['release_date'] ?? $item['releaseDate'] ?? ''), 0, 4);
                $rating = (float) ($item['rating_5based'] ?? 0) * 2 ?: (float) ($item['rating'] ?? 0);

                return [
                    'id' => (int) $item[$key],
                    'name' => (string) ($item['name'] ?? ''),
                    'poster' => (string) ($item['stream_icon'] ?? $item['cover'] ?? ''),
                    'meta' => trim(($year ?: '') . ($year && $rating > 0 ? ' · ' : '') . ($rating > 0 ? '★ ' . number_format($rating, 1) : '')),
                    'ext' => (string) ($item['container_extension'] ?? 'mp4') ?: 'mp4',
                ];
            })
            ->values();

        return response()->json(['category' => $categoryName, 'items' => $related]);
    }

    public function apiLive(Request $request): JsonResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return response()->json(['message' => 'No autenticado'], 401);
        }
        $categories = $this->xtreamService->getLiveCategories($serverUrl, $username, $password);
        $channels = $this->movieCompat->annotateLive($this->xtreamService->getLiveStreams($serverUrl, $username, $password));
        $selectedCategory = $request->query('category_id', 'all');
        if ($selectedCategory !== 'all') {
            $channels = array_values(array_filter($channels, fn ($ch) => (string) ($ch['category_id'] ?? '') === (string) $selectedCategory));
        }
        $selectedChannelId = (int) $request->query('ch', (int) ($channels[0]['stream_id'] ?? 0));
        $currentChannel = collect($channels)->firstWhere('stream_id', $selectedChannelId) ?? ($channels[0] ?? null);
        $streamCandidates = [];
        $streamUrl = null;
        if (!empty($currentChannel['stream_id'])) {
            $base = rtrim($serverUrl, '/') . "/live/{$username}/{$password}/{$currentChannel['stream_id']}";
            $streamCandidates = [
                $this->buildStreamProxyUrl("{$base}.m3u8"),
                $this->buildStreamProxyUrl("{$base}.ts"),
            ];
            $streamUrl = $streamCandidates[0];
        }
        return response()->json([
            'categories' => $categories,
            'channels' => array_slice($channels, 0, 300),
            'currentChannel' => $currentChannel,
            'streamUrl' => $streamUrl,
            'streamCandidates' => $streamCandidates,
            'selectedCategory' => $selectedCategory,
        ]);
    }

    public function streamProxy(Request $request)
    {
        [$serverUrl] = $this->getIptvSessionCredentials();
        if (! $this->hasIptvSession()) {
            abort(401);
        }

        set_time_limit(0);

        $encodedUrl = (string) $request->query('u', '');
        $remoteUrl = $this->decodeBase64Url($encodedUrl);

        if (! $remoteUrl || ! $this->isAllowedStreamUrl($remoteUrl, $serverUrl)) {
            abort(403);
        }

        session()->save();

        $requestHeaders = $this->buildUpstreamStreamHeaders($request, $serverUrl);
        $isPlaylist = str_contains(strtolower($remoteUrl), '.m3u8');
        $isTsSegment = str_contains(strtolower($remoteUrl), '.ts');

        if ($isPlaylist) {
            $playlistResponse = Http::withHeaders($requestHeaders)
                ->withOptions([
                    'stream' => true,
                    'decode_content' => false,
                    'http_errors' => false,
                ])
                ->timeout(30)
                ->get($remoteUrl);
            abort_unless($playlistResponse->successful(), 502);

            // Si el panel redirige la lista a otro de sus servidores, los fragmentos viven ahi, no en el servidor original.
            $effectiveUrl = (string) ($playlistResponse->effectiveUri() ?? $remoteUrl);
            $effectiveParts = parse_url($effectiveUrl) ?: [];
            $effectiveOrigin = ($effectiveParts['scheme'] ?? 'http') . '://' . ($effectiveParts['host'] ?? parse_url($serverUrl, PHP_URL_HOST))
                . (isset($effectiveParts['port']) ? ':' . $effectiveParts['port'] : '');

            $playlist = $this->rewriteM3u8Playlist($playlistResponse->body(), $effectiveUrl, $effectiveOrigin);

            return response($playlist, 200, [
                'Content-Type' => 'application/vnd.apple.mpegurl',
                'Cache-Control' => 'no-cache',
                'X-Accel-Buffering' => 'no',
                'Access-Control-Allow-Origin' => '*',
                'Content-Encoding' => 'identity',
            ]);
        }

        $streamResponse = Http::withHeaders($requestHeaders)
            ->withOptions([
                'stream' => true,
                'decode_content' => false,
                'http_errors' => false,
                'read_timeout' => 30,
            ])
            ->timeout(0)
            ->get($remoteUrl);
        abort_unless($streamResponse->successful(), 502);

        $body = $streamResponse->toPsrResponse()->getBody();
        $status = $streamResponse->status();
        $contentType = $streamResponse->header('Content-Type');
        if ($isTsSegment) {
            $contentType = 'video/mp2t';
        } elseif ($isPlaylist) {
            $contentType = 'application/vnd.apple.mpegurl';
        }

        $headers = [
            'Content-Type' => $contentType ?: 'application/octet-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Access-Control-Allow-Origin' => '*',
            'Content-Encoding' => 'identity',
        ];

        if ($streamResponse->header('Content-Length')) {
            $headers['Content-Length'] = $streamResponse->header('Content-Length');
        }

        if ($streamResponse->header('Content-Range')) {
            $headers['Content-Range'] = $streamResponse->header('Content-Range');
        }

        // El panel responde "Accept-Ranges: 0-<tamano>" en vez del valor estandar "bytes". Safari (iPhone) es estricto
        // con ese encabezado y no reproduce el video, asi que se normaliza.
        $acceptRanges = strtolower(trim((string) $streamResponse->header('Accept-Ranges')));
        if ($acceptRanges !== '' && $acceptRanges !== 'none') {
            $headers['Accept-Ranges'] = 'bytes';
        } elseif ($acceptRanges === 'none') {
            $headers['Accept-Ranges'] = 'none';
        } elseif ($streamResponse->header('Content-Range')) {
            $headers['Accept-Ranges'] = 'bytes';
        }

        return response()->stream(function () use ($body) {
            while (! $body->eof()) {
                echo $body->read(65536);
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            }
        }, $status, $headers);
    }

    /**
     * URL de reproduccion (HLS) de un canal en vivo. Si el panel lo permite se entrega la direccion HTTPS directa
     * (el video no pasa por este servidor); la del proxy va siempre como respaldo en fallback_url.
     */
    public function apiLiveStream(int $id): JsonResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $path = "/live/{$username}/{$password}/{$id}.m3u8";
        $proxyUrl = $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . $path);
        $directUrl = $this->directStreamUrl($serverUrl, $path);

        if ($directUrl) {
            return response()->json(['url' => $directUrl, 'fallback_url' => $proxyUrl, 'direct' => true]);
        }

        return response()->json(['url' => $proxyUrl, 'direct' => false]);
    }

    /**
     * Direccion HTTPS directa del panel para una ruta (/live/..., /movie/..., /series/...), o null si hay que pasar por
     * el proxy: otro servidor de login, panel sin HTTPS directo configurado, o contenido que vive en un servidor del panel
     * que no atiende por HTTPS (el navegador bloquearia la redireccion).
     */
    private function directStreamUrl(string $serverUrl, string $path): ?string
    {
        $directBase = (string) config('app.stream_direct_base');
        if ($directBase === ''
            || strtolower((string) parse_url($directBase, PHP_URL_HOST)) !== strtolower((string) parse_url($serverUrl, PHP_URL_HOST))) {
            return null;
        }

        $url = $directBase . $path;
        // La decision no depende del usuario: se guarda por tipo e id, sin las credenciales.
        $key = 'stream.direct.' . md5((string) preg_replace('#^/(live|movie|series)/[^/]+/[^/]+/#', '/$1/', $path));

        try {
            $ok = (bool) Cache::remember($key, now()->addMinutes(30), function () use ($url): bool {
                // Range para que, si el panel respondiera con el archivo en vez de redirigir, no se baje completo.
                $response = Http::withoutRedirecting()->timeout(6)->withUserAgent('Mozilla/5.0')
                    ->withHeaders(['Range' => 'bytes=0-0'])->get($url);
                if (in_array($response->status(), [200, 206], true)) {
                    return true;
                }
                if (! in_array($response->status(), [301, 302, 303, 307, 308], true)) {
                    throw new \RuntimeException('respuesta inesperada');
                }

                return str_starts_with(strtolower($response->header('Location')), 'https://');
            });
        } catch (Throwable) {
            // Sin respuesta clara (o error del panel): por el proxy, y se vuelve a intentar en la proxima apertura.
            return null;
        }

        return $ok ? $url : null;
    }

    public function apiMovies(): JsonResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return response()->json(['message' => 'No autenticado'], 401);
        }
        $items = $this->xtreamService->getVodStreams($serverUrl, $username, $password);
        $categories = $this->xtreamService->getVodCategories($serverUrl, $username, $password);
        return response()->json([
            'items' => $this->movieCompat->annotate($items),
            'categories' => $categories,
            // Peliculas que un navegador no reproduce bien (audio AC3/DTS, etc.). Los clientes con VLC pueden ignorarlas.
            'unplayable_ids' => array_map('intval', array_keys($this->movieCompat->unplayable())),
        ]);
    }

    public function apiSeries(): JsonResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return response()->json(['message' => 'No autenticado'], 401);
        }
        $items = $this->xtreamService->getSeries($serverUrl, $username, $password);
        $categories = $this->xtreamService->getSeriesCategories($serverUrl, $username, $password);
        return response()->json([
            'items' => $this->movieCompat->annotateSeries($items),
            'categories' => $categories,
            // Series que un navegador no reproduce bien (todos sus episodios sin audio compatible).
            'unplayable_ids' => array_map('intval', array_keys($this->movieCompat->unplayableSeries())),
        ]);
    }

    private function buildStreamProxyUrl(string $remoteUrl): string
    {
        $encodedUrl = rtrim(strtr(base64_encode($remoteUrl), '+/', '-_'), '=');

        return "/stream?u={$encodedUrl}";
    }

    private function buildUpstreamStreamHeaders(Request $request, string $serverUrl): array
    {
        $headers = [
            'Accept' => $request->header('Accept', 'video/*,application/vnd.apple.mpegurl,application/x-mpegURL,*/*'),
            'Accept-Encoding' => 'identity',
            'Accept-Language' => $request->header('Accept-Language', 'es-ES,es;q=0.7,en;q=0.3'),
            'User-Agent' => $request->header('User-Agent', 'Mozilla/5.0'),
            'Referer' => $request->header('Referer', $serverUrl),
            'Origin' => $request->header('Origin', $serverUrl),
        ];

        foreach (['Range', 'Cache-Control', 'Pragma'] as $header) {
            if ($request->filled($header) || $request->headers->has($header)) {
                $headers[$header] = $request->header($header);
            }
        }

        if ($request->headers->has('Sec-Fetch-Site')) {
            $headers['Sec-Fetch-Site'] = $request->header('Sec-Fetch-Site');
        }
        if ($request->headers->has('Sec-Fetch-Mode')) {
            $headers['Sec-Fetch-Mode'] = $request->header('Sec-Fetch-Mode');
        }
        if ($request->headers->has('Sec-Fetch-Dest')) {
            $headers['Sec-Fetch-Dest'] = $request->header('Sec-Fetch-Dest');
        }

        return $headers;
    }

    private function isAllowedStreamUrl(string $remoteUrl, string $serverUrl): bool
    {
        $remoteHost = parse_url($remoteUrl, PHP_URL_HOST);
        $serverHost = parse_url($serverUrl, PHP_URL_HOST);

        if (! $remoteHost || ! $serverHost) {
            return false;
        }

        $remoteHost = strtolower($remoteHost);

        // El panel puede repartir canales desde otros de sus servidores (balanceadores): se permiten solo los configurados.
        return $remoteHost === strtolower($serverHost)
            || in_array($remoteHost, array_map('strtolower', (array) config('app.stream_allowed_hosts', [])), true);
    }

    private function rewriteM3u8Playlist(string $playlist, string $remoteUrl, string $serverUrl): string
    {
        $lines = preg_split("/\r\n|\n|\r/", $playlist) ?: [];
        $baseUrl = rtrim(dirname($remoteUrl), '/') . '/';
        $rewritten = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);

            if ($trimmed === '') {
                $rewritten[] = $line;
                continue;
            }

            if (str_starts_with($trimmed, '#')) {
                $rewritten[] = $this->rewriteM3u8TagUris($line, $baseUrl, $serverUrl);
                continue;
            }

            $rewritten[] = $this->buildStreamProxyUrl(
                $this->resolveStreamUrl($trimmed, $baseUrl, $serverUrl)
            );
        }

        return implode("\n", $rewritten);
    }

    private function rewriteM3u8TagUris(string $line, string $baseUrl, string $serverUrl): string
    {
        return preg_replace_callback('/URI="([^"]+)"/', function (array $matches) use ($baseUrl, $serverUrl) {
            $absoluteUrl = $this->resolveStreamUrl($matches[1], $baseUrl, $serverUrl);

            return 'URI="' . $this->buildStreamProxyUrl($absoluteUrl) . '"';
        }, $line) ?? $line;
    }

    private function resolveStreamUrl(string $value, string $baseUrl, string $serverUrl): string
    {
        if (preg_match('#^https?://#i', $value)) {
            return $value;
        }

        if (str_starts_with($value, '/')) {
            return rtrim($serverUrl, '/') . $value;
        }

        return $baseUrl . ltrim($value, '/');
    }

    private function decodeBase64Url(string $value): string|false
    {
        $base64 = strtr($value, '-_', '+/');
        $padding = strlen($base64) % 4;

        if ($padding > 0) {
            $base64 .= str_repeat('=', 4 - $padding);
        }

        return base64_decode($base64, true);
    }
}
