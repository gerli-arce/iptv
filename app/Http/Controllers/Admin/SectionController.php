<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SectionController extends Controller
{
    public function index(): JsonResponse
    {
        $sections = HomeSection::with("items")->orderBy("position")->get();

        return response()->json($sections);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            "title" => ["required", "string", "max:255"],
            "slug" => ["nullable", "string", "max:255", "unique:home_sections,slug"],
            "type" => ["nullable", "in:manual,dynamic"],
            "content_type" => ["required", "in:live,movie,series,mixed"],
            "layout" => ["nullable", "in:carousel,grid,hero"],
            "position" => ["nullable", "integer", "min:0"],
            "active" => ["nullable", "boolean"],
        ]);

        if (empty($data["slug"])) {
            $data["slug"] = Str::slug($data["title"]);
        }

        $section = HomeSection::create($data);

        return response()->json($section, 201);
    }

    public function show(HomeSection $section): JsonResponse
    {
        return response()->json($section->load("items"));
    }

    public function update(Request $request, HomeSection $section): JsonResponse
    {
        $data = $request->validate([
            "title" => ["sometimes", "string", "max:255"],
            "slug" => ["sometimes", "string", "max:255", "unique:home_sections,slug," . $section->id],
            "type" => ["sometimes", "in:manual,dynamic"],
            "content_type" => ["sometimes", "in:live,movie,series,mixed"],
            "layout" => ["sometimes", "in:carousel,grid,hero"],
            "position" => ["sometimes", "integer", "min:0"],
            "active" => ["sometimes", "boolean"],
        ]);

        if (array_key_exists("title", $data) && ! array_key_exists("slug", $data)) {
            $data["slug"] = Str::slug($data["title"]);
        }

        $section->update($data);

        return response()->json($section);
    }

    public function destroy(HomeSection $section): JsonResponse
    {
        $section->delete();

        return response()->json([
            "message" => "Sección eliminada.",
        ]);
    }
}
