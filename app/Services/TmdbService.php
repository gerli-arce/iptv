<?php

namespace App\Services;

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
        ]);
    }

    public function movieDetails(int|string $id, string $language = "es-MX"): array
    {
        return $this->request("/movie/{$id}", [
            "language" => $language,
            "append_to_response" => "credits,videos,external_ids",
        ]);
    }

    public function seriesDetails(int|string $id, string $language = "es-MX"): array
    {
        return $this->request("/tv/{$id}", [
            "language" => $language,
            "append_to_response" => "credits,videos,external_ids",
        ]);
    }

    public function movieImages(int|string $id): array
    {
        return $this->request("/movie/{$id}/images", [
            "include_image_language" => "null,en,es",
        ]);
    }

    protected function request(string $path, array $params = []): array
    {
        $apiKey = env("TMDB_API_KEY");
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

            $verifySsl = filter_var(env("TMDB_VERIFY_SSL", env("APP_ENV") !== "local"), FILTER_VALIDATE_BOOL);
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

        return [
            "ok" => true,
            "status" => 200,
            "data" => $response->json(),
        ];
    }
}
