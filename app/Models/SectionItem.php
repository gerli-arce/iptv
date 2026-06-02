<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SectionItem extends Model
{
    protected $fillable = [
        "section_id",
        "content_type",
        "external_id",
        "position",
        "active",
    ];

    protected function casts(): array
    {
        return [
            "active" => "boolean",
        ];
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }
}
