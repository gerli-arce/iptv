<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SectionController extends Controller
{
    public function index(): JsonResponse
    {
        $sections = Section::with("items")->orderBy("position")->get();
        return response()->json($sections);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            "name" => ["required", "string", "max:255"],
            "slug" => ["nullable", "string", "max:255", "unique:sections,slug"],
            "layout" => ["nullable", "in:carousel,grid"],
            "position" => ["nullable", "integer", "min:0"],
            "active" => ["nullable", "boolean"],
        ]);

        if (empty($data["slug"])) {
            $data["slug"] = Str::slug($data["name"]);
        }

        $section = Section::create($data);
        return response()->json($section, 201);
    }

    public function show(Section $section): JsonResponse
    {
        return response()->json($section->load("items"));
    }

    public function update(Request $request, Section $section): JsonResponse
    {
        $data = $request->validate([
            "name" => ["sometimes", "string", "max:255"],
            "slug" => ["sometimes", "string", "max:255", "unique:sections,slug," . $section->id],
            "layout" => ["sometimes", "in:carousel,grid"],
            "position" => ["sometimes", "integer", "min:0"],
            "active" => ["sometimes", "boolean"],
        ]);

        if (array_key_exists("name", $data) && ! array_key_exists("slug", $data)) {
            $data["slug"] = Str::slug($data["name"]);
        }

        $section->update($data);
        return response()->json($section);
    }

    public function destroy(Section $section): JsonResponse
    {
        $section->delete();

        return response()->json([
            "message" => "Sección eliminada.",
        ]);
    }
}
