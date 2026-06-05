<?php

namespace App\Filament\Resources\NotificationCampaigns\Pages;

use App\Filament\Resources\NotificationCampaigns\NotificationCampaignResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditNotificationCampaign extends EditRecord
{
    protected static string $resource = NotificationCampaignResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
