<?php

namespace App\Filament\Resources\HomeSections\Tables;

use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class HomeSectionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('position')
            ->reorderable('position')
            ->columns([
                TextColumn::make('title')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('slug')
                    ->searchable(),
                TextColumn::make('type')
                    ->badge(),
                TextColumn::make('content_type')
                    ->badge(),
                TextColumn::make('layout')
                    ->badge(),
                TextColumn::make('items_count')
                    ->label('Items')
                    ->badge()
                    ->sortable(),
                TextColumn::make('position')
                    ->sortable(),
                IconColumn::make('active')
                    ->boolean(),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->emptyStateHeading('Sin secciones todavía');
    }
}
