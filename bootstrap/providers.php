<?php

$appTarget = env('APP_TARGET', 'player');

return array_values(array_filter([
    App\Providers\AppServiceProvider::class,
    $appTarget === 'admin' ? App\Providers\Filament\AdminPanelProvider::class : null,
]));
