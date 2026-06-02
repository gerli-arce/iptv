<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $fillable = [
        "title",
        "subtitle",
        "image_url",
        "mobile_image_url",
        "action_type",
        "action_payload",
        "position",
        "active",
    ];

    protected function casts(): array
    {
        return [
            "action_payload" => "array",
            "active" => "boolean",
        ];
    }
}
