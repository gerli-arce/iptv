<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TmdbService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImdbController extends Controller
{
    public function __construct(private readonly TmdbService $tmdbService)
    {
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "q" => ["required", "string", "min:2"],
            "language" => ["nullable", "string", "max:10"],
        ]);

        $result = $this->tmdbService->searchMulti(
            $validated["q"],
            $validated["language"] ?? "es-MX"
        );

        return response()->json($result, $result["status"] ?? 200);
    }

    public function movie(Request $request, int $id): JsonResponse
    {
        $result = $this->tmdbService->movieDetails(
            $id,
            $request->string("language", "es-MX")->toString()
        );

        return response()->json($result, $result["status"] ?? 200);
    }

    public function series(Request $request, int $id): JsonResponse
    {
        $result = $this->tmdbService->seriesDetails(
            $id,
            $request->string("language", "es-MX")->toString()
        );

        return response()->json($result, $result["status"] ?? 200);
    }
}

