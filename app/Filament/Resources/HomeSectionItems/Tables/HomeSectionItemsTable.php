<?php

namespace App\Filament\Resources\HomeSectionItems\Tables;

use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\TextInputColumn;
use Filament\Tables\Table;

class HomeSectionItemsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('position')
            ->reorderable('position')
            ->columns([
                TextColumn::make('section.title')
                    ->label('Section')
                    ->badge()
                    ->sortable(),
                TextColumn::make('content_type')
                    ->badge(),
                TextColumn::make('external_id')
                    ->searchable()
                    ->copyable(),
                TextColumn::make('custom_title')
                    ->searchable(),
                ImageColumn::make('custom_image')
                    ->label('Image')
                    ->square(),
                TextColumn::make('badge')
                    ->badge()
                    ->toggleable(),
                TextInputColumn::make('position')
                    ->type('number')
                    ->sortable(),
                IconColumn::make('active')
                    ->boolean(),
                TextColumn::make('starts_at')
                    ->dateTime()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('ends_at')
                    ->dateTime()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->emptyStateHeading('Sin elementos todavía');
    }
}
