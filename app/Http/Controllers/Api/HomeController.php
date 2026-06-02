<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Section;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    public function index(): JsonResponse
    {
        $banners = Banner::query()
            ->where("active", true)
            ->orderBy("position")
            ->get();

        $sections = Section::query()
            ->where("active", true)
            ->orderBy("position")
            ->with([
                "items" => fn ($q) => $q->where("active", true)->orderBy("position"),
            ])
            ->get();

        return response()->json([
            "banners" => $banners,
            "sections" => $sections,
            "generated_at" => now()->toISOString(),
        ]);
    }
}
