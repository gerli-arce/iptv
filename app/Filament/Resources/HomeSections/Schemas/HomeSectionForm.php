<?php

namespace App\Filament\Resources\HomeSections\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class HomeSectionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(2)
            ->components([
                TextInput::make('title')
                    ->required()
                    ->maxLength(255),
                TextInput::make('slug')
                    ->helperText('Se puede dejar vacío y generarlo después.')
                    ->maxLength(255),
                Select::make('type')
                    ->options([
                        'manual' => 'Manual',
                        'dynamic' => 'Dynamic',
                    ])
                    ->required()
                    ->default('manual'),
                Select::make('content_type')
                    ->options([
                        'live' => 'Live',
                        'movie' => 'Movie',
                        'series' => 'Series',
                        'mixed' => 'Mixed',
                    ])
                    ->required()
                    ->default('mixed'),
                Select::make('layout')
                    ->options([
                        'carousel' => 'Carousel',
                        'grid' => 'Grid',
                        'hero' => 'Hero',
                    ])
                    ->required()
                    ->default('carousel'),
                TextInput::make('position')
                    ->numeric()
                    ->required()
                    ->default(0),
                Toggle::make('active')
                    ->default(true)
                    ->required(),
            ]);
    }
}
