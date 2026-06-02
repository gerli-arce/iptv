<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\TmdbService;
use App\Services\XtreamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Throwable;
use Illuminate\View\View;

class PortalController extends Controller
{
    public function __construct(
        private readonly XtreamService $xtreamService,
        private readonly TmdbService $tmdbService
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
            $candidates = array_values(array_unique([
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/movie/{$username}/{$password}/{$id}.{$ext}"),
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/movie/{$username}/{$password}/{$id}.mp4"),
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/movie/{$username}/{$password}/{$id}.mkv"),
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/movie/{$username}/{$password}/{$id}.m3u8"),
                $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/movie/{$username}/{$password}/{$id}.ts"),
            ]));
            $url = $candidates[0];
            $title = "Pelicula {$id}";
        }

        if (! $url) {
            return redirect()->route('app');
        }

        return view('portal.player', compact('url', 'title', 'type', 'candidates'));
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
        $candidates = array_values(array_unique([
            $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/series/{$username}/{$password}/{$selected['id']}.{$selectedExt}"),
            $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/series/{$username}/{$password}/{$selected['id']}.mp4"),
            $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/series/{$username}/{$password}/{$selected['id']}.mkv"),
            $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/series/{$username}/{$password}/{$selected['id']}.m3u8"),
            $this->buildStreamProxyUrl(rtrim($serverUrl, '/') . "/series/{$username}/{$password}/{$selected['id']}.ts"),
        ]));
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

    public function apiLive(Request $request): JsonResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return response()->json(['message' => 'No autenticado'], 401);
        }
        $categories = $this->xtreamService->getLiveCategories($serverUrl, $username, $password);
        $channels = $this->xtreamService->getLiveStreams($serverUrl, $username, $password);
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

        $encodedUrl = (string) $request->query('u', '');
        $remoteUrl = $this->decodeBase64Url($encodedUrl);

        if (! $remoteUrl || ! $this->isAllowedStreamUrl($remoteUrl, $serverUrl)) {
            abort(403);
        }

        session()->save();

        if (str_contains(strtolower($remoteUrl), '.m3u8')) {
            $playlistResponse = Http::timeout(30)->get($remoteUrl);
            abort_unless($playlistResponse->successful(), 502);

            $playlist = $this->rewriteM3u8Playlist($playlistResponse->body(), $remoteUrl, $serverUrl);

            return response($playlist, 200, [
                'Content-Type' => 'application/vnd.apple.mpegurl',
                'Cache-Control' => 'no-store, no-cache, must-revalidate',
                'X-Accel-Buffering' => 'no',
            ]);
        }

        $requestHeaders = [];
        if ($request->header('Range')) {
            $requestHeaders['Range'] = $request->header('Range');
        }

        set_time_limit(0);

        $streamResponse = Http::withHeaders($requestHeaders)
            ->withOptions([
                'stream' => true,
                'read_timeout' => 30,
            ])
            ->timeout(0)
            ->get($remoteUrl);
        abort_unless($streamResponse->successful(), 502);

        $body = $streamResponse->toPsrResponse()->getBody();
        $status = $streamResponse->status();
        $headers = [
            'Content-Type' => $streamResponse->header('Content-Type', 'application/octet-stream'),
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'Accept-Ranges' => $streamResponse->header('Accept-Ranges', 'bytes'),
            'X-Accel-Buffering' => 'no',
        ];

        if ($streamResponse->header('Content-Length')) {
            $headers['Content-Length'] = $streamResponse->header('Content-Length');
        }

        if ($streamResponse->header('Content-Range')) {
            $headers['Content-Range'] = $streamResponse->header('Content-Range');
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

    public function apiMovies(): JsonResponse
    {
        [$serverUrl, $username, $password] = $this->getIptvSessionCredentials();
        if (! $serverUrl || ! $username || ! $password) {
            return response()->json(['message' => 'No autenticado'], 401);
        }
        $items = $this->xtreamService->getVodStreams($serverUrl, $username, $password);
        $categories = $this->xtreamService->getVodCategories($serverUrl, $username, $password);
        return response()->json([
            'items' => $items,
            'categories' => $categories,
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
            'items' => $items,
            'categories' => $categories,
        ]);
    }

    private function buildStreamProxyUrl(string $remoteUrl): string
    {
        $encodedUrl = rtrim(strtr(base64_encode($remoteUrl), '+/', '-_'), '=');

        return "/stream?u={$encodedUrl}";
    }

    private function isAllowedStreamUrl(string $remoteUrl, string $serverUrl): bool
    {
        $remoteHost = parse_url($remoteUrl, PHP_URL_HOST);
        $serverHost = parse_url($serverUrl, PHP_URL_HOST);

        if (! $remoteHost || ! $serverHost) {
            return false;
        }

        return strtolower($remoteHost) === strtolower($serverHost);
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
