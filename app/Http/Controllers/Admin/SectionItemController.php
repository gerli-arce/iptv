<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\SectionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionItemController extends Controller
{
    public function indexBySection(Section $section): JsonResponse
    {
        return response()->json(
            $section->items()->orderBy("position")->get()
        );
    }

    public function store(Request $request, Section $section): JsonResponse
    {
        $data = $request->validate([
            "content_type" => ["required", "in:movie,series,live"],
            "external_id" => ["required", "string", "max:80"],
            "position" => ["nullable", "integer", "min:0"],
            "active" => ["nullable", "boolean"],
        ]);

        $item = $section->items()->create($data);
        return response()->json($item, 201);
    }

    public function update(Request $request, Section $section, SectionItem $item): JsonResponse
    {
        if ($item->section_id !== $section->id) {
            return response()->json([
                "message" => "El item no pertenece a la sección indicada.",
            ], 422);
        }

        $data = $request->validate([
            "content_type" => ["sometimes", "in:movie,series,live"],
            "external_id" => ["sometimes", "string", "max:80"],
            "position" => ["sometimes", "integer", "min:0"],
            "active" => ["sometimes", "boolean"],
        ]);

        $item->update($data);
        return response()->json($item);
    }

    public function destroy(Section $section, SectionItem $item): JsonResponse
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
