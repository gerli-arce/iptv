<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

class TmdbService
{
    public function searchMulti(string $query, string $language = "es-MX"): array
    {
        return $this->request("/search/multi", [
            "query" => $query,
            "include_adult" => false,
            "language" => $language,
        ], 1440);
    }

    public function searchMovie(string $query, ?int $year = null, string $language = "es-MX"): array
    {
        return $this->request("/search/movie", array_filter([
            "query" => $query,
            "include_adult" => false,
            "language" => $language,
            "year" => $year,
        ], fn ($value) => $value !== null), 1440);
    }

    public function searchTv(string $query, ?int $year = null, string $language = "es-MX"): array
    {
        return $this->request("/search/tv", array_filter([
            "query" => $query,
            "include_adult" => false,
            "language" => $language,
            "first_air_date_year" => $year,
        ], fn ($value) => $value !== null), 1440);
    }

    public function tvSeason(int|string $tvId, int $season, string $language = "es-MX"): array
    {
        return $this->request("/tv/{$tvId}/season/{$season}", ["language" => $language], 10080);
    }

    public function movieDetails(int|string $id, string $language = "es-MX"): array
    {
        return $this->request("/movie/{$id}", [
            "language" => $language,
            "append_to_response" => "credits,videos,external_ids",
            "include_video_language" => "es,en,null",
        ], 10080);
    }

    public function seriesDetails(int|string $id, string $language = "es-MX"): array
    {
        return $this->request("/tv/{$id}", [
            "language" => $language,
            "append_to_response" => "credits,videos,external_ids",
            "include_video_language" => "es,en,null",
        ], 10080);
    }

    public function movieImages(int|string $id): array
    {
        return $this->request("/movie/{$id}/images", [
            "include_image_language" => "null,en,es",
        ]);
    }

    /**
     * @param int $cacheMinutes minutos que se guarda una respuesta correcta (0 = sin guardar). Los errores nunca se guardan.
     */
    protected function request(string $path, array $params = [], int $cacheMinutes = 0): array
    {
        $cacheKey = "tmdb." . md5($path . json_encode($params));
        if ($cacheMinutes > 0 && ($cached = Cache::get($cacheKey)) !== null) {
            return $cached;
        }

        $apiKey = config("services.tmdb.key");
        if (! $apiKey) {
            return [
                "ok" => false,
                "status" => 500,
                "message" => "TMDB_API_KEY no configurada en .env",
            ];
        }

        try {
            $http = Http::connectTimeout(3)
                ->timeout(5)
                ->retry(2, 250);

            $verifySsl = (bool) config("services.tmdb.verify_ssl");
            if (! $verifySsl) {
                $http = $http->withoutVerifying();
            }

            $response = $http->get("https://api.themoviedb.org/3{$path}", array_merge($params, [
                    "api_key" => $apiKey,
                ]));
        } catch (Throwable $e) {
            return [
                "ok" => false,
                "status" => 503,
                "message" => "TMDb temporalmente no disponible",
                "error" => $e->getMessage(),
            ];
        }

        if (! $response->successful()) {
            return [
                "ok" => false,
                "status" => $response->status(),
                "message" => "Error consultando TMDb",
                "error" => $response->json(),
            ];
        }

        $result = [
            "ok" => true,
            "status" => 200,
            "data" => $response->json(),
        ];

        if ($cacheMinutes > 0) {
            Cache::put($cacheKey, $result, now()->addMinutes($cacheMinutes));
        }

        return $result;
    }
}
