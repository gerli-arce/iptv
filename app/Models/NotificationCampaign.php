<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationCampaign extends Model
{
    protected $fillable = [
        'title',
        'body',
        'image_url',
        'content_type',
        'external_id',
        'target',
        'status',
        'sent_at',
        'sent_count',
        'failed_count',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'sent_count' => 'integer',
            'failed_count' => 'integer',
        ];
    }
}
