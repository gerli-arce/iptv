<?php

namespace Database\Seeders;

use App\Models\HomeSection;
use Illuminate\Database\Seeder;

class HomeSectionSeeder extends Seeder
{
    public function run(): void
    {
        $sections = [
            [
                "title" => "Películas recomendadas",
                "slug" => "peliculas-recomendadas",
                "content_type" => "movie",
                "position" => 1,
            ],
            [
                "title" => "Series destacadas",
                "slug" => "series-destacadas",
                "content_type" => "series",
                "position" => 2,
            ],
            [
                "title" => "Canales favoritos",
                "slug" => "canales-favoritos",
                "content_type" => "live",
                "position" => 3,
            ],
        ];

        foreach ($sections as $section) {
            HomeSection::updateOrCreate(
                ["slug" => $section["slug"]],
                [
                    "title" => $section["title"],
                    "type" => "manual",
                    "content_type" => $section["content_type"],
                    "layout" => "carousel",
                    "position" => $section["position"],
                    "active" => true,
                ]
            );
        }
    }
}
