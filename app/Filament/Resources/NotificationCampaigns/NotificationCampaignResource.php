<?php

namespace App\Filament\Resources\NotificationCampaigns;

use App\Filament\Resources\NotificationCampaigns\Pages\CreateNotificationCampaign;
use App\Filament\Resources\NotificationCampaigns\Pages\EditNotificationCampaign;
use App\Filament\Resources\NotificationCampaigns\Pages\ListNotificationCampaigns;
use App\Filament\Resources\NotificationCampaigns\Schemas\NotificationCampaignForm;
use App\Filament\Resources\NotificationCampaigns\Tables\NotificationCampaignsTable;
use App\Models\NotificationCampaign;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class NotificationCampaignResource extends Resource
{
    protected static ?string $model = NotificationCampaign::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBellAlert;

    protected static string|UnitEnum|null $navigationGroup = 'Notificaciones';

    protected static ?string $navigationLabel = 'Campanas';

    protected static ?int $navigationSort = 1;

    protected static ?string $recordTitleAttribute = 'title';

    public static function form(Schema $schema): Schema
    {
        return NotificationCampaignForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return NotificationCampaignsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListNotificationCampaigns::route('/'),
            'create' => CreateNotificationCampaign::route('/create'),
            'edit' => EditNotificationCampaign::route('/{record}/edit'),
        ];
    }
}
