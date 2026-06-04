<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use App\Models\HomeSectionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionItemController extends Controller
{
    public function indexBySection(HomeSection $section): JsonResponse
    {
        return response()->json(
            $section->items()->orderBy("position")->get()
        );
    }

    public function store(Request $request, HomeSection $section): JsonResponse
    {
        $data = $request->validate([
            "content_type" => ["required", "in:movie,series,live"],
            "external_id" => ["required", "string", "max:255"],
            "custom_title" => ["nullable", "string", "max:255"],
            "custom_image" => ["nullable", "string", "max:2048"],
            "badge" => ["nullable", "string", "max:255"],
            "position" => ["nullable", "integer", "min:0"],
            "active" => ["nullable", "boolean"],
            "starts_at" => ["nullable", "date"],
            "ends_at" => ["nullable", "date", "after_or_equal:starts_at"],
        ]);

        $item = $section->items()->create($data);

        return response()->json($item, 201);
    }

    public function update(Request $request, HomeSection $section, HomeSectionItem $item): JsonResponse
    {
        if ($item->section_id !== $section->id) {
            return response()->json([
                "message" => "El item no pertenece a la sección indicada.",
            ], 422);
        }

        $data = $request->validate([
            "content_type" => ["sometimes", "in:movie,series,live"],
            "external_id" => ["sometimes", "string", "max:255"],
            "custom_title" => ["nullable", "string", "max:255"],
            "custom_image" => ["nullable", "string", "max:2048"],
            "badge" => ["nullable", "string", "max:255"],
            "position" => ["sometimes", "integer", "min:0"],
            "active" => ["sometimes", "boolean"],
            "starts_at" => ["nullable", "date"],
            "ends_at" => ["nullable", "date", "after_or_equal:starts_at"],
        ]);

        $item->update($data);

        return response()->json($item);
    }

    public function destroy(HomeSection $section, HomeSectionItem $item): JsonResponse
    {
        if ($item->section_id !== $section->id) {
            return response()->json([
                "message" => "El item no pertenece a la sección indicada.",
            ], 422);
        }

        $item->delete();

        return response()->json([
            "message" => "Item eliminado de la sección.",
        ]);
    }
}
