<?php

namespace App\Filament\Resources\NotificationCampaigns\Tables;

use App\Models\NotificationCampaign;
use App\Services\FirebaseNotificationService;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Notifications\Notification;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class NotificationCampaignsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('updated_at', 'desc')
            ->columns([
                TextColumn::make('title')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('target')
                    ->badge()
                    ->sortable(),
                TextColumn::make('status')
                    ->badge()
                    ->sortable(),
                TextColumn::make('content_type')
                    ->toggleable(),
                TextColumn::make('external_id')
                    ->toggleable()
                    ->searchable(),
                TextColumn::make('sent_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('sent_count')
                    ->sortable(),
                TextColumn::make('failed_count')
                    ->sortable(),
                TextColumn::make('updated_at')
                    ->since()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->recordActions([
                Action::make('sendNotification')
                    ->label('Enviar notificacion')
                    ->icon(Heroicon::OutlinedPaperAirplane)
                    ->color('warning')
                    ->requiresConfirmation()
                    ->action(function (NotificationCampaign $record): void {
                        app(FirebaseNotificationService::class)->sendCampaign($record);

                        Notification::make()
                            ->success()
                            ->title('Campana preparada')
                            ->body('La campana quedo marcada para envio o prueba.')
                            ->send();
                    }),
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->emptyStateHeading('Sin campanas todavia');
    }
}
