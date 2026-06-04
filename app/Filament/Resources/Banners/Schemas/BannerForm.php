<?php

namespace App\Filament\Resources\Banners\Schemas;

use App\Services\AdminCatalogService;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;

class BannerForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(2)
            ->components([
                TextInput::make('title')
                    ->required()
                    ->maxLength(255),
                Select::make('content_type')
                    ->options([
                        'live' => 'Live',
                        'movie' => 'Movie',
                        'series' => 'Series',
                        'url' => 'Url',
                    ])
                    ->live()
                    ->afterStateUpdated(function (Set $set): void {
                        $set('external_id', null);
                        $set('image_url', null);
                        $set('mobile_image_url', null);
                        $set('title', null);
                    })
                    ->required()
                    ->default('url'),
                TextInput::make('subtitle')
                    ->maxLength(255)
                    ->columnSpanFull(),
                TextInput::make('image_url')
                    ->label('Image URL')
                    ->url()
                    ->required()
                    ->helperText('Si eliges un contenido remoto, puedes autollenar esta imagen desde el servidor.')
                    ->maxLength(2048),
                TextInput::make('mobile_image_url')
                    ->label('Mobile Image URL')
                    ->url()
                    ->maxLength(2048),
                Select::make('external_id')
                    ->label('Contenido del servidor')
                    ->visible(fn (Get $get): bool => $get('content_type') !== 'url')
                    ->searchable()
                    ->placeholder('Busca y selecciona contenido del servidor')
                    ->helperText('Selecciona el tipo y busca el contenido remoto que quieres recomendar. Usa la sesion IPTV actual o configura catalog_server_url, catalog_username y catalog_password.')
                    ->getSearchResultsUsing(function (string $search, Get $get): array {
                        $contentType = (string) $get('content_type');

                        if (blank($contentType) || $contentType === 'url') {
                            return [];
                        }

                        return app(AdminCatalogService::class)->searchOptions($contentType, $search);
                    })
                    ->getOptionLabelUsing(function ($value, Get $get): ?string {
                        $contentType = (string) $get('content_type');

                        if (blank($contentType) || $contentType === 'url') {
                            return null;
                        }

                        return app(AdminCatalogService::class)->optionLabel($contentType, $value);
                    })
                    ->afterStateUpdated(function (?string $state, Set $set, Get $get): void {
                        if (blank($state)) {
                            return;
                        }

                        $contentType = (string) $get('content_type');

                        if (blank($contentType) || $contentType === 'url') {
                            return;
                        }

                        $catalog = app(AdminCatalogService::class);
                        $item = $catalog->findItem($contentType, $state);

                        if (! $item) {
                            return;
                        }

                        $set('title', $catalog->itemTitle($item, $contentType));

                        $image = $catalog->itemImage($item);

                        if (filled($image)) {
                            $set('image_url', $image);
                            $set('mobile_image_url', $image);
                        }
                    }),
                TextInput::make('action_url')
                    ->visible(fn (Get $get): bool => $get('content_type') === 'url')
                    ->required(fn (Get $get): bool => $get('content_type') === 'url')
                    ->url()
                    ->helperText('Solo se usa cuando el banner abre una URL externa.')
                    ->maxLength(2048),
                TextInput::make('position')
                    ->numeric()
                    ->default(0)
                    ->required(),
                Toggle::make('active')
                    ->default(true)
                    ->required(),
                DateTimePicker::make('starts_at'),
                DateTimePicker::make('ends_at'),
            ]);
    }
}
