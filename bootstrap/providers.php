<?php

// Aqui config() aun no esta cargado, por eso se lee la variable de entorno directamente.
$appTarget = env('APP_TARGET', 'player');

return array_values(array_filter([
    App\Providers\AppServiceProvider::class,
    $appTarget === 'admin' ? App\Providers\Filament\AdminPanelProvider::class : null,
]));
