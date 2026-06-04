<?php

namespace App\Filament\Resources\AppSettings\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class AppSettingForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(2)
            ->components([
                TextInput::make('key')
                    ->required()
                    ->maxLength(255),
                Select::make('type')
                    ->options([
                        'string' => 'String',
                        'boolean' => 'Boolean',
                        'integer' => 'Integer',
                        'json' => 'Json',
                    ])
                    ->required()
                    ->default('string'),
                Textarea::make('value')
                    ->rows(6)
                    ->helperText('Se guarda como texto. Usa JSON válido si el tipo es json.')
                    ->columnSpanFull(),
            ]);
    }
}
