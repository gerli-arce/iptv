<?php

namespace App\Filament\Resources\NotificationCampaigns\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class NotificationCampaignForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(2)
            ->components([
                TextInput::make('title')
                    ->required()
                    ->maxLength(255),
                Select::make('target')
                    ->options([
                        'all' => 'All',
                        'users' => 'Users',
                        'android' => 'Android',
                        'ios' => 'iOS',
                    ])
                    ->default('all')
                    ->required(),
                Textarea::make('body')
                    ->required()
                    ->rows(6)
                    ->columnSpanFull(),
                TextInput::make('image_url')
                    ->url()
                    ->maxLength(2048),
                TextInput::make('content_type')
                    ->maxLength(100),
                TextInput::make('external_id')
                    ->maxLength(255),
                Select::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'test' => 'Test',
                        'sent' => 'Sent',
                        'failed' => 'Failed',
                    ])
                    ->default('draft')
                    ->required(),
            ]);
    }
}
