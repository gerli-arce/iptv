<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class Banner extends Model
{
    protected $fillable = [
        "title",
        "subtitle",
        "image_url",
        "mobile_image_url",
        "content_type",
        "external_id",
        "action_url",
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
