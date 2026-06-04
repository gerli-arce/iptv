<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use Illuminate\Database\Seeder;

class AppSettingSeeder extends Seeder
{
    public function run(): void
    {
        AppSetting::updateOrCreate(
            ["key" => "player_default"],
            [
                "value" => "auto",
                "type" => "string",
            ]
        );

        foreach ([
            "catalog_server_url" => null,
            "catalog_username" => null,
            "catalog_password" => null,
        ] as $key => $value) {
            AppSetting::updateOrCreate(
                ["key" => $key],
                [
                    "value" => $value,
                    "type" => "string",
                ]
            );
        }
    }
}
