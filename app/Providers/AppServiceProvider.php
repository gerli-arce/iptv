<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->environment('production') && is_file(public_path('hot'))) {
            @unlink(public_path('hot'));
        }

        if (app()->environment('production')) {
            URL::forceScheme('https');
            Vite::useHotFile(storage_path('framework/vite.hot'));
        }
    }
}
