<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $table = "app_settings";

    protected $fillable = [
        "key",
        "value",
        "type",
    ];

    public function typedValue(): mixed
    {
        if ($this->value === null) {
            return null;
        }

        return match ($this->type) {
            "boolean" => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            "integer" => (int) $this->value,
            "json" => json_decode($this->value, true),
            default => $this->value,
        };
    }
}
