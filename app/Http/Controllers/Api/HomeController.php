<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Banner;
use App\Models\HomeSection;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    public function index(): JsonResponse
    {
        $moment = now();

        $banners = Banner::query()
            ->visible($moment)
            ->orderBy("position")
            ->get();

        $sections = HomeSection::query()
            ->where("active", true)
            ->orderBy("position")
            ->with([
                "items" => fn ($query) => $query->visible($moment)->orderBy("position"),
            ])
            ->get();

        $settings = AppSetting::query()
            ->orderBy("key")
            ->get()
            ->mapWithKeys(fn (AppSetting $setting) => [
                $setting->key => $setting->typedValue(),
            ]);

        return response()->json([
            "banners" => $banners,
            "sections" => $sections,
            "settings" => $settings,
        ]);
    }
}
