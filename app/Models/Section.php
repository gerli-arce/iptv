<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    protected $fillable = [
        "name",
        "slug",
        "layout",
        "position",
        "active",
    ];

    protected function casts(): array
    {
        return [
            "active" => "boolean",
        ];
    }

    public function items()
    {
        return $this->hasMany(SectionItem::class)->orderBy("position");
    }
}
