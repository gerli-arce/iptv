<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class HomeSectionItem extends Model
{
    protected $table = "home_section_items";

    protected $fillable = [
        "section_id",
        "content_type",
        "external_id",
        "custom_title",
        "custom_image",
        "badge",
        "position",
        "active",
        "starts_at",
        "ends_at",
    ];

    protected function casts(): array
    {
        return [
            "active" => "boolean",
            "starts_at" => "datetime",
            "ends_at" => "datetime",
        ];
    }

    public function section()
    {
        return $this->belongsTo(HomeSection::class, "section_id");
    }

    public function scopeVisible(Builder $query, ?Carbon $moment = null): Builder
    {
        $moment ??= now();

        return $query
            ->where("active", true)
            ->where(function (Builder $builder) use ($moment) {
                $builder->whereNull("starts_at")->orWhere("starts_at", "<=", $moment);
            })
            ->where(function (Builder $builder) use ($moment) {
                $builder->whereNull("ends_at")->orWhere("ends_at", ">=", $moment);
            });
    }
}
