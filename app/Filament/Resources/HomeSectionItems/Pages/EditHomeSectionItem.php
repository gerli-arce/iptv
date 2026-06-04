<?php

namespace App\Filament\Resources\HomeSectionItems\Pages;

use App\Filament\Resources\HomeSectionItems\HomeSectionItemResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditHomeSectionItem extends EditRecord
{
    protected static string $resource = HomeSectionItemResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
