<?php

namespace App\Services;

use App\Models\NotificationCampaign;
use Illuminate\Support\Facades\Log;

class FirebaseNotificationService
{
    public function isConfigured(): bool
    {
        $projectId = (string) config('firebase.project_id');
        $credentials = config('firebase.credentials');
        $serverKey = (string) config('firebase.server_key');

        return filled($projectId) && (filled($credentials) || filled($serverKey));
    }

    public function sendCampaign(NotificationCampaign $campaign): array
    {
        $configured = $this->isConfigured();

        $campaign->forceFill([
            'status' => $configured ? 'sent' : 'test',
            'sent_at' => now(),
            'sent_count' => 0,
            'failed_count' => 0,
        ])->save();

        Log::info('Notification campaign prepared for delivery.', [
            'campaign_id' => $campaign->id,
            'title' => $campaign->title,
            'target' => $campaign->target,
            'status' => $campaign->status,
            'firebase_configured' => $configured,
        ]);

        return [
            'ok' => true,
            'mode' => $configured ? 'sent' : 'test',
            'campaign' => $campaign->fresh(),
        ];
    }
}
