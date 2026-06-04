<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class HomeSection extends Model
{
    protected $fillable = [
        "title",
        "slug",
        "type",
        "content_type",
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
        return $this->hasMany(HomeSectionItem::class, "section_id")->orderBy("position");
    }

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where("active", true);
    }
}
