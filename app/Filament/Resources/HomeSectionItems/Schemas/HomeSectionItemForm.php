<?php

namespace App\Filament\Resources\HomeSectionItems\Schemas;

use App\Services\AdminCatalogService;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;

class HomeSectionItemForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(2)
            ->components([
                Select::make('section_id')
                    ->relationship('section', 'title')
                    ->searchable()
                    ->preload()
                    ->required(),
                Select::make('content_type')
                    ->options([
                        'live' => 'Live',
                        'movie' => 'Movie',
                        'series' => 'Series',
                    ])
                    ->live()
                    ->afterStateUpdated(function (Set $set): void {
                        $set('external_id', null);
                        $set('custom_title', null);
                        $set('custom_image', null);
                    })
                    ->required(),
                Select::make('external_id')
                    ->label('Contenido del servidor')
                    ->searchable()
                    ->placeholder('Busca y selecciona contenido del servidor')
                    ->helperText('Primero elige el tipo y luego busca el contenido remoto. Usa la sesion IPTV actual o configura catalog_server_url, catalog_username y catalog_password.')
                    ->getSearchResultsUsing(function (string $search, Get $get): array {
                        $contentType = (string) $get('content_type');

                        if (blank($contentType)) {
                            return [];
                        }

                        return app(AdminCatalogService::class)->searchOptions($contentType, $search);
                    })
                    ->getOptionLabelUsing(function ($value, Get $get): ?string {
                        $contentType = (string) $get('content_type');

                        if (blank($contentType)) {
                            return null;
                        }

                        return app(AdminCatalogService::class)->optionLabel($contentType, $value);
                    })
                    ->afterStateUpdated(function (?string $state, Set $set, Get $get): void {
                        if (blank($state)) {
                            return;
                        }

                        $contentType = (string) $get('content_type');

                        if (blank($contentType)) {
                            return;
                        }

                        $catalog = app(AdminCatalogService::class);
                        $item = $catalog->findItem($contentType, $state);

                        if (! $item) {
                            return;
                        }

                        if (blank($get('custom_title'))) {
                            $set('custom_title', $catalog->itemTitle($item, $contentType));
                        }

                        if (blank($get('custom_image'))) {
                            $set('custom_image', $catalog->itemImage($item));
                        }
                    })
                    ->required(),
                TextInput::make('custom_title')
                    ->maxLength(255),
                TextInput::make('custom_image')
                    ->label('Custom Image URL')
                    ->url()
                    ->maxLength(2048),
                TextInput::make('badge')
                    ->maxLength(255),
                TextInput::make('position')
                    ->numeric()
                    ->required()
                    ->default(0),
                Toggle::make('active')
                    ->default(true)
                    ->required(),
                DateTimePicker::make('starts_at'),
                DateTimePicker::make('ends_at'),
            ]);
    }
}
