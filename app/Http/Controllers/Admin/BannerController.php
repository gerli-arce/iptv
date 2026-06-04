<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    public function index(): JsonResponse
    {
        $banners = Banner::orderBy("position")->get();

        return response()->json($banners);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            "title" => ["required", "string", "max:255"],
            "subtitle" => ["nullable", "string", "max:255"],
            "image_url" => ["required", "string", "max:2048"],
            "mobile_image_url" => ["nullable", "string", "max:2048"],
            "content_type" => ["required", "in:live,movie,series,url"],
            "external_id" => ["nullable", "string", "max:255"],
            "action_url" => ["nullable", "string", "max:2048"],
            "position" => ["nullable", "integer", "min:0"],
            "active" => ["nullable", "boolean"],
            "starts_at" => ["nullable", "date"],
            "ends_at" => ["nullable", "date", "after_or_equal:starts_at"],
        ]);

        $banner = Banner::create($data);

        return response()->json($banner, 201);
    }

    public function show(Banner $banner): JsonResponse
    {
        return response()->json($banner);
    }

    public function update(Request $request, Banner $banner): JsonResponse
    {
        $data = $request->validate([
            "title" => ["sometimes", "string", "max:255"],
            "subtitle" => ["nullable", "string", "max:255"],
            "image_url" => ["sometimes", "string", "max:2048"],
            "mobile_image_url" => ["nullable", "string", "max:2048"],
            "content_type" => ["sometimes", "in:live,movie,series,url"],
            "external_id" => ["nullable", "string", "max:255"],
            "action_url" => ["nullable", "string", "max:2048"],
            "position" => ["sometimes", "integer", "min:0"],
            "active" => ["sometimes", "boolean"],
            "starts_at" => ["nullable", "date"],
            "ends_at" => ["nullable", "date", "after_or_equal:starts_at"],
        ]);

        $banner->update($data);

        return response()->json($banner);
    }

    public function destroy(Banner $banner): JsonResponse
    {
        $banner->delete();

        return response()->json([
            "message" => "Banner eliminado.",
        ]);
    }
}
