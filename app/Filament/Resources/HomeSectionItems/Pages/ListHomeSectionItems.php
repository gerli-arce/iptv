<?php

namespace App\Filament\Resources\HomeSectionItems\Pages;

use App\Filament\Resources\HomeSectionItems\HomeSectionItemResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListHomeSectionItems extends ListRecords
{
    protected static string $resource = HomeSectionItemResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
