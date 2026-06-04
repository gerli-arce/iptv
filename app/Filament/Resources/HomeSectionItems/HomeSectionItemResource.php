<?php

namespace App\Filament\Resources\HomeSectionItems;

use App\Filament\Resources\HomeSectionItems\Pages\CreateHomeSectionItem;
use App\Filament\Resources\HomeSectionItems\Pages\EditHomeSectionItem;
use App\Filament\Resources\HomeSectionItems\Pages\ListHomeSectionItems;
use App\Filament\Resources\HomeSectionItems\Schemas\HomeSectionItemForm;
use App\Filament\Resources\HomeSectionItems\Tables\HomeSectionItemsTable;
use App\Models\HomeSectionItem;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class HomeSectionItemResource extends Resource
{
    protected static ?string $model = HomeSectionItem::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedListBullet;

    protected static string|UnitEnum|null $navigationGroup = 'Contenido';

    protected static ?string $navigationLabel = 'Elementos de seccion';

    protected static ?int $navigationSort = 3;

    protected static ?string $recordTitleAttribute = 'external_id';

    public static function form(Schema $schema): Schema
    {
        return HomeSectionItemForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return HomeSectionItemsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListHomeSectionItems::route('/'),
            'create' => CreateHomeSectionItem::route('/create'),
            'edit' => EditHomeSectionItem::route('/{record}/edit'),
        ];
    }
}
