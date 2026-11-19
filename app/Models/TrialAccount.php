<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrialAccount extends Model
{
    protected $fillable = [
        'name',
        'dni',
        'address',
        'city',
        'phone',
        'username',
        'panel_line_id',
        'expires_at',
        'ip',
        'device_id',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }
}
